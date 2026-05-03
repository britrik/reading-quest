import { test, expect } from "@playwright/test";
import {
  getFirstProfileId,
  resetTestProfile,
  setActiveProfileForPage,
  waitForRoot,
} from "./helpers";

test.describe("British/American English toggle", () => {
  test.beforeEach(async () => {
    await resetTestProfile();
  });

  test("defaults to en-GB and exposes languageVariant in kid-readable GET", async ({ request }) => {
    const id = await getFirstProfileId();
    const res = await request.get("/api/preferences", { headers: { "x-profile-id": String(id) } });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.languageVariant).toBe("en-GB");
  });

  test("kid PUT cannot change languageVariant (401), grown-up PUT can", async ({ request }) => {
    const id = await getFirstProfileId();

    const kidRes = await request.put("/api/preferences", {
      headers: { "x-profile-id": String(id), "content-type": "application/json" },
      data: { languageVariant: "en-US" },
    });
    expect(kidRes.status()).toBe(401);

    const grownRes = await request.put("/api/preferences", {
      headers: {
        "x-profile-id": String(id),
        "content-type": "application/json",
        "x-grownup-token": "grownup:e2e-token",
      },
      data: { languageVariant: "en-US" },
    });
    expect(grownRes.ok()).toBe(true);
    const body = await grownRes.json();
    expect(body.languageVariant).toBe("en-US");

    const reread = await (
      await request.get("/api/preferences", { headers: { "x-profile-id": String(id) } })
    ).json();
    expect(reread.languageVariant).toBe("en-US");
  });

  test("kid Settings header swaps Cosy/Cozy when grown-up flips the toggle", async ({ page, request }) => {
    const id = await getFirstProfileId();
    await setActiveProfileForPage(page, id);

    // Default en-GB → "Cosy Settings"
    await page.goto("/settings");
    await waitForRoot(page);
    await expect(page.getByRole("heading", { name: "Cosy Settings" })).toBeVisible();

    // Grown-up flips to en-US via the API.
    await request.put("/api/preferences", {
      headers: {
        "x-profile-id": String(id),
        "content-type": "application/json",
        "x-grownup-token": "grownup:e2e-token",
      },
      data: { languageVariant: "en-US" },
    });

    await page.reload();
    await waitForRoot(page);
    await expect(page.getByRole("heading", { name: "Cozy Settings" })).toBeVisible();
  });

  test("grown-ups settings card lets a grown-up toggle the language style", async ({ page }) => {
    await page.goto("/grownups");
    await waitForRoot(page);
    await page.getByPlaceholder(/passcode|••••/i).fill("1234");
    await page.getByRole("button", { name: /unlock|enter|sign in/i }).click();

    const select = page.getByTestId("settings-language-variant");
    await expect(select).toBeVisible({ timeout: 10_000 });
    await expect(select).toHaveValue("en-GB");
    await select.selectOption("en-US");
    await expect(select).toHaveValue("en-US");

    // Harden against optimistic-UI false positives: confirm the change was
    // actually persisted server-side, not merely reflected in local state.
    const id = await getFirstProfileId();
    const persisted = await (
      await page.request.get(`/api/preferences`, { headers: { "x-profile-id": String(id) } })
    ).json();
    expect(persisted.languageVariant).toBe("en-US");
  });
});
