import { test, expect } from "@playwright/test";
import {
  expectNoAxeViolations,
  resetTestProfile,
  waitForRoot,
  apiPost,
  apiGet,
  getFirstChapterIds,
  getMe,
} from "./helpers";

test.beforeEach(async () => {
  await resetTestProfile();
});

test("pet den loads with companion + tabs", async ({ page }) => {
  await page.goto("/pet");
  await waitForRoot(page);
  await expect(page.getByRole("button", { name: /feed/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /dress up/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /decorate/i })).toBeVisible();
});

test("snack purchase consumes gems and bumps fullness", async ({ page }) => {
  // Earn some gems first by finishing a chapter via the API.
  const { chapterId } = await getFirstChapterIds();
  const session = await apiPost("/api/sessions", { chapterId });
  await apiPost(`/api/sessions/${session.id}/finish`);
  const before = await getMe();
  const petBefore = await apiGet("/api/pet");
  expect(before.gems).toBeGreaterThan(0);

  await page.goto("/pet");
  await waitForRoot(page);

  // Click the cheapest snack: Glow Berry (1 gem).
  await page.getByRole("button", { name: /glow berry/i }).first().click();

  // The HUD should reflect 1 fewer gem, and pet state should update server-side.
  await expect(page.locator("body")).toContainText(String(before.gems - 1), {
    timeout: 5_000,
  });
  const petAfter = await apiGet("/api/pet");
  expect(petAfter.fullness).toBeGreaterThan(petBefore.fullness);
  expect(petAfter.gems).toBe(before.gems - 1);
});

test("equipped hat persists across a full page reload", async ({ page }) => {
  const ids = await getFirstChapterIds();
  let s = await apiPost("/api/sessions", { chapterId: ids.chapterId });
  await apiPost(`/api/sessions/${s.id}/finish`);
  const story = await apiGet(`/api/stories/${ids.storyId}`);
  s = await apiPost("/api/sessions", { chapterId: story.chapters[1].id });
  await apiPost(`/api/sessions/${s.id}/finish`);

  await page.goto("/pet");
  await waitForRoot(page);
  await page.getByRole("button", { name: /dress up/i }).click();
  await page.getByRole("button", { name: /tiny crown/i }).first().click();
  await expect.poll(async () => (await apiGet("/api/pet")).equippedHat, { timeout: 5_000 }).toBe("hat.crown");

  // Hard reload — the equipped hat must still be reflected after a fresh boot.
  await page.reload();
  await waitForRoot(page);
  const after = await apiGet("/api/pet");
  expect(after.equippedHat).toBe("hat.crown");
});

test("equip + unequip a hat updates pet state", async ({ page }) => {
  // Need ≥6 gems for Tiny Crown — finish two chapters.
  const ids = await getFirstChapterIds();
  let s = await apiPost("/api/sessions", { chapterId: ids.chapterId });
  await apiPost(`/api/sessions/${s.id}/finish`);
  // Find the next chapter id and finish it too.
  const story = await apiGet(`/api/stories/${ids.storyId}`);
  const nextChapter = story.chapters[1];
  s = await apiPost("/api/sessions", { chapterId: nextChapter.id });
  await apiPost(`/api/sessions/${s.id}/finish`);
  const me = await getMe();
  expect(me.gems).toBeGreaterThanOrEqual(6);

  await page.goto("/pet");
  await waitForRoot(page);
  await page.getByRole("button", { name: /dress up/i }).click();

  // Tiny Crown is the first listed hat (cost 6). Click it twice — first to
  // purchase + auto-equip, second time should be a no-op (already equipped).
  await page.getByRole("button", { name: /tiny crown/i }).first().click();
  await expect.poll(async () => (await apiGet("/api/pet")).equippedHat, {
    timeout: 5_000,
  }).toBe("hat.crown");

  // Unequip via the "no hat" choice.
  await page.getByRole("button", { name: /no hat/i }).first().click().catch(async () => {
    // Fallback: some renderings label it differently — find a "Bare" / "None".
    await page.getByRole("button", { name: /bare|none/i }).first().click();
  });
  await expect.poll(async () => (await apiGet("/api/pet")).equippedHat, {
    timeout: 5_000,
  }).toBeNull();
});

test("pet den has no serious accessibility violations", async ({ page }) => {
  await page.goto("/pet");
  await waitForRoot(page);
  await expectNoAxeViolations(page, "pet-den");
});
