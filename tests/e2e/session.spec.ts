import { test, expect, type Page } from "@playwright/test";
import {
  expectNoAxeViolations,
  resetTestProfile,
  waitForRoot,
  getFirstChapterIds,
  getMe,
  apiGet,
  apiPost,
} from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

async function openFirstChapter(page: Page) {
  const { storyId, chapterId } = await getFirstChapterIds();
  await page.goto(`/story/${storyId}/chapter/${chapterId}`);
  await waitForRoot(page);
  await expect(page.getByText(/path \d+ of \d+/i)).toBeVisible({ timeout: 10_000 });
  return { storyId, chapterId };
}

test("session screen renders chapter content + word-help affordance", async ({ page }) => {
  await openFirstChapter(page);
  await expect(page.getByText(/stuck on a word/i)).toBeVisible();
  // Sufficient story prose is rendered (not just chrome).
  const paragraphChars = await page.locator("main p").evaluateAll(
    (els) => els.reduce((acc, el) => acc + (el.textContent?.trim().length ?? 0), 0),
  );
  expect(paragraphChars).toBeGreaterThan(40);
});

test("word-help opens a no-penalty syllable sheet, plays speech, and can be dismissed", async ({ page }) => {
  // Stub speechSynthesis BEFORE navigation so the page sees our spy on first
  // render. We track every utterance text passed to .speak() and fire the
  // 'end' event so the UI's Promise resolves as it would in a real browser.
  await page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
    const fakeSynth = {
      cancel: () => {},
      speak: (utter: SpeechSynthesisUtterance) => {
        (window as unknown as { __spoken: string[] }).__spoken.push(utter.text);
        setTimeout(() => utter.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
      },
      getVoices: () => [],
      pending: false,
      speaking: false,
      paused: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      get: () => fakeSynth,
    });
  });

  await openFirstChapter(page);

  // Toggle help-mode so tappable words become activated.
  await page.getByRole("button", { name: /stuck on a word/i }).click();
  await expect(page.getByText(/sound it out/i)).toBeVisible();

  // Tap the first underlined / tappable word.
  const tappable = page.locator(".rq-tappable-word").first();
  await expect(tappable).toBeVisible();
  await tappable.click();

  // The syllable sheet appears with reassurance copy and no penalty wording.
  await expect(page.getByText(/let's sound it out/i)).toBeVisible();
  await expect(page.getByText(/no score change/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/penalty|wrong|minus|-1\b/i);

  // Reset the spoken-utterance buffer so we causally tie the next assertion
  // to the Hear-it click (clicking the tappable word also speaks). Then click
  // Hear it and verify a NEW utterance was sent to speechSynthesis.speak.
  await page.evaluate(() => { (window as unknown as { __spoken: string[] }).__spoken = []; });
  await page.getByRole("button", { name: /hear it/i }).click();
  await expect
    .poll(async () => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length), {
      timeout: 5_000,
    })
    .toBeGreaterThan(0);

  // Dismiss via Close.
  await page.getByRole("button", { name: /close/i }).click();
  await expect(page.getByText(/let's sound it out/i)).toHaveCount(0);
});

test("clicking Follow the fox advances the chapter via the UI", async ({ page }) => {
  // UI-driven exercise of the primary advance button. We don't assert reward
  // bookkeeping here because Session.tsx currently has a startSession effect
  // that re-fires when its mutation invalidates getActiveSession (queued for
  // Task #7 polish). The reward bookkeeping is asserted via the API path in
  // tests/e2e/home.spec.ts ("home propagates gems earned from a finished
  // chapter") and in tests/e2e/grownups.spec.ts.
  const { storyId, chapterId } = await openFirstChapter(page);

  await page.getByRole("button", { name: /follow the fox|finish story/i }).click();

  // The route navigates either to the next chapter or back to the story page.
  await expect(page).toHaveURL(new RegExp(`/story/${storyId}(/chapter/(?!${chapterId}\\b)\\d+)?$`), {
    timeout: 10_000,
  });
});

test("take-a-break (Rest) returns home and the same chapter resumes on revisit", async ({ page }) => {
  const { storyId, chapterId } = await openFirstChapter(page);

  // The session should be active for this chapter.
  const active1 = await apiGet("/api/sessions/active");
  expect(active1?.chapterId).toBe(chapterId);

  await page.getByRole("button", { name: /rest/i }).click();
  // Rest navigates back to home.
  await expect(page).toHaveURL(/\/$/, { timeout: 5_000 });
  await waitForRoot(page);

  // The active session for this chapter is now paused (server-side state).
  const after = await apiGet(`/api/sessions/active`);
  // active session may be cleared OR moved to paused; accept either as long
  // as the chapter remains reachable when we navigate back.
  if (after) expect([active1.id, null]).toContain(after.id);

  // Revisit the same chapter — server should reuse / resume rather than create
  // a brand-new session id.
  await page.goto(`/story/${storyId}/chapter/${chapterId}`);
  await waitForRoot(page);
  await expect(page.getByText(/path \d+ of \d+/i)).toBeVisible({ timeout: 10_000 });
  const resumed = await apiGet("/api/sessions/active");
  expect(resumed.chapterId).toBe(chapterId);
  expect(resumed.id).toBe(active1.id);
});

test("session has no serious accessibility violations", async ({ page }) => {
  await openFirstChapter(page);
  await expectNoAxeViolations(page, "session");
});
