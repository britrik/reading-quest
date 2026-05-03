import { test, expect } from "@playwright/test";
import {
  apiPost,
  expectNoAxeViolations,
  getFirstChapterIds,
  getFirstProfileId,
  resetTestProfile,
  setActiveProfileForPage,
  waitForRoot,
} from "./helpers";

async function logIntoGrownups(page: import("@playwright/test").Page) {
  await page.goto("/grownups");
  await waitForRoot(page);
  await page.getByPlaceholder("Passcode").fill("1234");
  await page.getByRole("button", { name: /enter/i }).click();
  await expect(page.getByText(/family dashboard/i)).toBeVisible();
}

test.describe("Grown-ups extras: vocabulary, weekly summary, export, profile manager", () => {
  test.beforeEach(async () => {
    await resetTestProfile();
  });

  test("vocabulary panel renders rows after word-help events", async ({ page, request }) => {
    const { chapterId } = await getFirstChapterIds();
    const chapterRes = await request.get(`/api/chapters/${chapterId}`);
    const chapter = (await chapterRes.json()) as { tappableWords: Array<{ key: string; word: string }> };
    const target = chapter.tappableWords[0]!;
    const session = await apiPost("/api/sessions", { chapterId });
    await apiPost(`/api/sessions/${session.id}/word-help`, { wordKey: target.key });

    await logIntoGrownups(page);
    const panel = page.getByTestId("vocab-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId(`vocab-row-${target.key}`)).toBeVisible();
    await expect(panel.getByTestId(`vocab-row-${target.key}`)).toHaveAttribute(
      "data-status",
      /new|practicing|learned/,
    );
    await expectNoAxeViolations(page, "grownups extras");
  });

  test("weekly summary shows highlights", async ({ page }) => {
    await logIntoGrownups(page);
    const summary = page.getByTestId("weekly-summary");
    await expect(summary).toBeVisible();
    await expect(page.getByTestId("weekly-highlights").locator("li").first()).toBeVisible();
  });

  test("data export button downloads JSON with profile + sessions", async ({ page }) => {
    const { chapterId } = await getFirstChapterIds();
    await apiPost("/api/sessions", { chapterId });

    await logIntoGrownups(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/reading-quest-.*\.json$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs/promises");
    const text = await fs.readFile(path!, "utf-8");
    const json = JSON.parse(text);
    expect(json.schemaVersion).toBe(1);
    expect(json.profile.name).toBeTruthy();
    expect(Array.isArray(json.sessions)).toBe(true);
    expect(json.sessions.length).toBeGreaterThan(0);
  });

  test("profile manager can add and delete a profile", async ({ page }) => {
    await logIntoGrownups(page);
    await page.getByTestId("open-add-profile").click();
    await page.getByTestId("manager-profile-name").fill("Robin");
    await page.getByTestId("manager-avatar-bunny").click();
    await page.getByTestId("manager-add-submit").click();

    // The new row should appear in the list
    const list = page.getByTestId("profile-manager-list");
    await expect(list.getByText("Robin")).toBeVisible();

    // Find the row and delete it. Use a dialog handler since we use confirm().
    page.on("dialog", (d) => d.accept());
    const newRowId = await page.evaluate(async () => {
      const res = await fetch("/api/profiles");
      const data = (await res.json()) as Array<{ id: number; name: string }>;
      return data.find((p) => p.name === "Robin")?.id ?? null;
    });
    expect(newRowId).not.toBeNull();
    await page.getByTestId(`manager-delete-${newRowId}`).click();
    await expect(list.getByText("Robin")).toHaveCount(0);
  });

  test("home page exposes settings + switch-profile shortcuts", async ({ page }) => {
    const id = await getFirstProfileId();
    await setActiveProfileForPage(page, id);
    await page.goto("/");
    await waitForRoot(page);
    await expect(page.getByTestId("open-settings")).toBeVisible();
    await expect(page.getByTestId("switch-profile")).toBeVisible();
    await page.getByTestId("open-settings").click();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
