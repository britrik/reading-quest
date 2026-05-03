import { test, expect } from "@playwright/test";
import { expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("home loads with HUD and worlds", async ({ page }) => {
  await page.goto("/");
  await waitForRoot(page);

  // Wait for at least one world card to render.
  await expect(page.getByText(/whispering woods|cloud ruins|crystal caverns/i).first()).toBeVisible({ timeout: 10_000 });

  // HUD shows initial gems = 0
  await expect(page.locator("body")).toContainText(/0/);
});

test("home has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "home");
});
