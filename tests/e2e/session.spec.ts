import { test, expect } from "@playwright/test";
import { expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

async function openFirstChapter(page: import("@playwright/test").Page) {
  // Pull worlds + stories + chapters via API to navigate deterministically.
  const apiBase = process.env.E2E_API_URL || "http://localhost:80";
  const worlds = await (await page.request.get(`${apiBase}/api/worlds`)).json();
  const worldId = worlds[0].id;
  const stories = await (await page.request.get(`${apiBase}/api/worlds/${worldId}/stories`)).json();
  const storyId = stories[0].id;
  const story = await (await page.request.get(`${apiBase}/api/stories/${storyId}`)).json();
  const chapterId = story.chapters[0].id;
  await page.goto(`/story/${storyId}/chapter/${chapterId}`);
  await waitForRoot(page);
}

test("session screen loads chapter content", async ({ page }) => {
  await openFirstChapter(page);
  await expect(page.locator("body")).toContainText(/path \d+ of \d+/i);
  await expect(page.getByText(/stuck on a word/i).first()).toBeVisible();
});

test("word-help mode toggles without penalty UI", async ({ page }) => {
  await openFirstChapter(page);
  await page.getByText(/stuck on a word/i).first().click();
  // Should not show any score / penalty / minus indicator
  await expect(page.locator("body")).not.toContainText(/-1|penalty|wrong/i);
});

test("session has no serious accessibility violations", async ({ page }) => {
  await openFirstChapter(page);
  await expectNoAxeViolations(page, "session");
});
