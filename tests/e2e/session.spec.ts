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

test("word-help opens a no-penalty syllable sheet that can be dismissed", async ({ page }) => {
  await openFirstChapter(page);

  // Toggle help-mode on so tappable words are activated.
  await page.getByRole("button", { name: /stuck on a word/i }).click();
  await expect(page.getByText(/sound it out/i)).toBeVisible();

  // Tap the first underlined / tappable word.
  const tappable = page.locator(".rq-tappable-word").first();
  await expect(tappable).toBeVisible();
  await tappable.click();

  // The syllable sheet appears, with at least one syllable chip and the
  // no-score reassurance copy. Crucially, no penalty / minus copy is shown.
  await expect(page.getByText(/let's sound it out/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /hear it/i })).toBeVisible();
  await expect(page.getByText(/no score change/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/penalty|wrong|minus|-1\b/i);

  // Dismiss via the explicit Close button.
  await page.getByRole("button", { name: /close/i }).click();
  await expect(page.getByText(/let's sound it out/i)).toHaveCount(0);
});

test("finishing the chapter awards gems + stars and they appear on home", async ({ page }) => {
  const { storyId, chapterId } = await openFirstChapter(page);

  const before = await getMe();
  // Drive the finish via the same endpoint the UI calls. Asserting through the
  // session POST is more reliable than waiting on toast animations.
  const active = await apiGet("/api/sessions/active");
  expect(active?.chapterId).toBe(chapterId);
  const finished = await apiPost(`/api/sessions/${active.id}/finish`);
  expect(finished.gemsAwarded).toBeGreaterThan(0);
  expect(finished.starsAwarded).toBeGreaterThan(0);

  const after = await getMe();
  expect(after.gems).toBe(before.gems + finished.gemsAwarded);
  expect(after.stars).toBe(before.stars + finished.starsAwarded);

  // Cross-screen propagation: navigate to home and confirm the new totals
  // are reflected in the HUD copy.
  await page.goto("/");
  await waitForRoot(page);
  await expect(page.locator("body")).toContainText(String(after.gems));
  await expect(page.locator("body")).toContainText(String(after.stars));

  // Sanity: storyId still exists in URL space (we navigated away cleanly).
  expect(storyId).toBeGreaterThan(0);
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
