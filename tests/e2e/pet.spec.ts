import { test, expect } from "@playwright/test";
import { expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("pet den loads with companion and shop tabs", async ({ page }) => {
  await page.goto("/pet");
  await waitForRoot(page);
  await expect(page.locator("body")).toContainText(/feed|hat|color|decor/i);
});

test("pet den has no serious accessibility violations", async ({ page }) => {
  await page.goto("/pet");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "pet-den");
});
