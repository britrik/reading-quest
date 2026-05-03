import { test, expect } from "@playwright/test";
import {
  apiGet,
  expectNoAxeViolations,
  resetTestProfile,
  setActiveProfileForPage,
  waitForRoot,
} from "./helpers";

test.describe("Onboarding (3-step tap-only)", () => {
  test.beforeEach(async () => {
    await resetTestProfile({ onboarded: false });
  });

  test("walks all three steps and lands in the picked world", async ({ page }) => {
    const profiles = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = profiles[0]!.id;
    await setActiveProfileForPage(page, id);

    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/onboarding$/);

    await expect(page.getByTestId("onboarding-step-0")).toBeVisible();
    await expectNoAxeViolations(page, "onboarding step 0");
    await page.getByTestId("onboarding-next").click();

    await expect(page.getByTestId("onboarding-step-1")).toBeVisible();
    await page.getByTestId("companion-fox").click();
    await page.getByTestId("onboarding-next").click();

    await expect(page.getByTestId("onboarding-step-2")).toBeVisible();
    const worlds = (await apiGet("/api/worlds")) as Array<{ id: number }>;
    const worldId = worlds[0]!.id;
    await page.getByTestId(`world-pick-${worldId}`).click();
    await page.getByTestId("onboarding-finish").click();

    await expect(page).toHaveURL(new RegExp(`/world/${worldId}$`));

    const after = (await apiGet("/api/profiles")) as Array<{ id: number; onboarded: boolean }>;
    expect(after.find((p) => p.id === id)?.onboarded).toBe(true);
  });

  test("skip button completes onboarding and goes Home", async ({ page }) => {
    const profiles = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    await setActiveProfileForPage(page, profiles[0]!.id);

    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByTestId("onboarding-skip").click();
    await expect(page).toHaveURL(/\/$/);

    const after = (await apiGet("/api/profiles")) as Array<{ onboarded: boolean }>;
    expect(after[0]!.onboarded).toBe(true);
  });
});
