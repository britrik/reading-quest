import { test, expect } from "@playwright/test";
import { resetTestProfile, waitForRoot } from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("home respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForRoot(page);

  // Reduced-motion emulation must be honored by the browser.
  const matches = await page.evaluate(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(matches).toBe(true);

  // And our CSS must downgrade the floating animation.
  const floats = page.locator(".animate-float").first();
  if (await floats.count()) {
    const { name, duration } = await floats.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, duration: cs.animationDuration };
    });
    const reduced =
      name === "none" || duration === "0s" || /^0\.0010?ms$/.test(duration);
    expect(reduced).toBe(true);
  }
  await expect(page).toHaveURL(/\/$/);
});
