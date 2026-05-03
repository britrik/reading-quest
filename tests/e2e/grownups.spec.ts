import { test, expect } from "@playwright/test";
import {
  expectNoAxeViolations,
  resetTestProfile,
  waitForRoot,
  apiPost,
  getFirstChapterIds,
} from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("grownups gate rejects a wrong passcode", async ({ page }) => {
  const alerts: string[] = [];
  page.on("dialog", async (d) => {
    alerts.push(d.message());
    await d.dismiss();
  });
  await page.goto("/grownups");
  await waitForRoot(page);
  await page.getByPlaceholder(/passcode|••••/i).fill("0000");
  await page.getByRole("button", { name: /unlock|enter|sign in/i }).click();
  await expect.poll(() => alerts.join(" "), { timeout: 5_000 }).toMatch(/incorrect/i);
  // Still on the gate (no dashboard rendered).
  await expect(page.getByText(/grown-ups area/i)).toBeVisible();
});

test("grownups dashboard reflects kid activity (after finishing a chapter)", async ({ page }) => {
  // Seed activity: finish one chapter.
  const { chapterId } = await getFirstChapterIds();
  const session = await apiPost("/api/sessions", { chapterId });
  await apiPost(`/api/sessions/${session.id}/finish`);

  await page.goto("/grownups");
  await waitForRoot(page);
  await page.getByPlaceholder(/passcode|••••/i).fill("1234");
  await page.getByRole("button", { name: /unlock|enter|sign in/i }).click();

  // Dashboard cards become visible — at least one chapter finished is shown
  // somewhere on the page ("1 chapters total").
  await expect(page.getByText(/grown-ups view/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("body")).toContainText(/1 chapters total/i, {
    timeout: 5_000,
  });
});

test("grownups gate has no serious accessibility violations", async ({ page }) => {
  await page.goto("/grownups");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "grownups-gate");
});
