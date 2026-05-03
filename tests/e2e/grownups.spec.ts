import { test, expect } from "@playwright/test";
import { expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

const PASSCODE = process.env.GROWNUPS_PASSCODE || "1234";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("grownups gate rejects wrong passcode", async ({ page }) => {
  await page.goto("/grownups");
  await waitForRoot(page);
  const input = page.locator('input[type="password"], input[type="tel"], input').first();
  await input.fill("0000");
  await page.getByRole("button", { name: /enter|unlock|sign in|continue/i }).first().click();
  await expect(page.locator("body")).not.toContainText(/minutes read|stories finished|words helped/i);
});

test("grownups gate accepts correct passcode and shows dashboard", async ({ page }) => {
  await page.goto("/grownups");
  await waitForRoot(page);
  const input = page.locator('input[type="password"], input[type="tel"], input').first();
  await input.fill(PASSCODE);
  await page.getByRole("button", { name: /enter|unlock|sign in|continue/i }).first().click();
  await expect(page.locator("body")).toContainText(/minutes|stories|words/i, { timeout: 10_000 });
});

test("grownups gate has no serious accessibility violations", async ({ page }) => {
  await page.goto("/grownups");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "grownups-gate");
});
