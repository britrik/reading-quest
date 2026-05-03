import { test, expect } from "@playwright/test";
import {
  expectNoAxeViolations,
  resetTestProfile,
  waitForRoot,
  apiPost,
  getFirstChapterIds,
  getMe,
} from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("home loads with HUD and world cards", async ({ page }) => {
  await page.goto("/");
  await waitForRoot(page);

  // World cards from seed.
  await expect(
    page
      .getByText(/whispering woods|cloud ruins|crystal caverns/i)
      .first(),
  ).toBeVisible({ timeout: 10_000 });

  // HUD shows initial gems = 0.
  await expect(page.locator("body")).toContainText(/0/);
});

test("home is keyboard-reachable to first interactive element", async ({ page }) => {
  await page.goto("/");
  await waitForRoot(page);

  // Tab a few times — at least one focused element must be a real interactive
  // node (button or link) so kids using a keyboard / switch can navigate.
  let landed = false;
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.tagName?.toLowerCase() ?? "";
    });
    if (tag === "a" || tag === "button") {
      landed = true;
      break;
    }
  }
  expect(landed, "Tab should reach a button or link from the home page").toBe(true);
});

test("home propagates gems earned from a finished chapter", async ({ page }) => {
  // Seed: finish the first chapter via the API, then load home.
  const { chapterId } = await getFirstChapterIds();
  const session = await apiPost("/api/sessions", { chapterId });
  await apiPost(`/api/sessions/${session.id}/finish`);
  const me = await getMe();
  expect(me.gems).toBeGreaterThan(0);
  expect(me.stars).toBeGreaterThan(0);

  await page.goto("/");
  await waitForRoot(page);
  // The HUD should reflect the awarded gems and stars.
  const body = page.locator("body");
  await expect(body).toContainText(String(me.gems));
  await expect(body).toContainText(String(me.stars));
});

test("home renders the kid-friendly fallback when /api/me fails", async ({ page }) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' }),
  );
  await page.goto("/");
  await waitForRoot(page);
  await expect(page.getByText(/worlds are resting/i)).toBeVisible({ timeout: 10_000 });
});

test("home has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "home");
});
