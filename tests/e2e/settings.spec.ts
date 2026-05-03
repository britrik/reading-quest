import { test, expect } from "@playwright/test";
import {
  expectNoAxeViolations,
  getFirstProfileId,
  resetTestProfile,
  setActiveProfileForPage,
  waitForRoot,
} from "./helpers";

test.describe("Cozy Settings", () => {
  test.beforeEach(async () => {
    await resetTestProfile();
  });

  test("can change preferences and they apply to the document and persist after reload", async ({ page }) => {
    const id = await getFirstProfileId();
    await setActiveProfileForPage(page, id);
    await page.goto("/settings");
    await waitForRoot(page);
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expectNoAxeViolations(page, "settings page");

    await page.getByTestId("font-large").click();
    await expect(page.locator("html")).toHaveAttribute("data-font-size", "large");
    await expect(page.locator("html")).toHaveClass(/rq-font-large/);

    await page.getByTestId("toggle-high-contrast").click();
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");

    await page.getByTestId("toggle-reduced-motion").click();
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");

    // Wait for the autosave indicator before reloading.
    await expect(page.getByTestId("settings-status")).toHaveText(/Saved/);

    await page.reload();
    await waitForRoot(page);
    await expect(page.locator("html")).toHaveAttribute("data-font-size", "large");
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  });

  test("preferences GET/PUT round-trips voiceSpeed and soundscape", async ({ request }) => {
    const id = await getFirstProfileId();
    // voiceSpeed is a grown-up-only field, so the kid app cannot set it
    // without the grown-ups token. soundscape is kid-callable.
    const headers = {
      "x-profile-id": String(id),
      "content-type": "application/json",
      "x-grownup-token": "grownup:e2e-token",
    };

    let res = await request.get("/api/preferences", { headers: { "x-profile-id": String(id) } });
    expect(res.ok()).toBe(true);
    const before = await res.json();
    expect(before.voiceSpeed).toBeCloseTo(0.9, 1);
    expect(before.soundscape).toBe("none");

    res = await request.put("/api/preferences", {
      headers,
      data: { voiceSpeed: 1.2, soundscape: "forest" },
    });
    expect(res.ok()).toBe(true);
    const after = await res.json();
    expect(after.voiceSpeed).toBeCloseTo(1.2, 1);
    expect(after.soundscape).toBe("forest");

    // Re-read to confirm persistence
    const reread = await (await request.get("/api/preferences", { headers: { "x-profile-id": String(id) } })).json();
    expect(reread.voiceSpeed).toBeCloseTo(1.2, 1);
    expect(reread.soundscape).toBe("forest");
  });

  test("preferences are scoped per-profile", async ({ request }) => {
    const id1 = await getFirstProfileId();
    const created = await request.post("/api/profiles", {
      headers: { "content-type": "application/json", "x-grownup-token": "grownup:e2e-token" },
      data: { name: "Pref2", avatar: "bunny" },
    });
    const p2 = (await created.json()) as { id: number };

    await request.put("/api/preferences", {
      headers: { "x-profile-id": String(id1), "content-type": "application/json" },
      data: { fontSize: "large" },
    });
    await request.put("/api/preferences", {
      headers: { "x-profile-id": String(p2.id), "content-type": "application/json" },
      data: { fontSize: "small" },
    });

    const a = await (await request.get("/api/preferences", { headers: { "x-profile-id": String(id1) } })).json();
    const b = await (await request.get("/api/preferences", { headers: { "x-profile-id": String(p2.id) } })).json();
    expect(a.fontSize).toBe("large");
    expect(b.fontSize).toBe("small");
  });
});
