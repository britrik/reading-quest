import { test, expect } from "@playwright/test";
import { apiGet, expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

test.describe("Multi-profile system", () => {
  test.beforeEach(async () => {
    await resetTestProfile({ onboarded: false });
  });

  test("with multiple profiles, cold start redirects to picker", async ({ page, request }) => {
    // Add a second profile so the gate cannot auto-pick.
    await request.post("/api/profiles", {
      headers: { "content-type": "application/json" },
      data: { name: "Cleo", avatar: "owl" },
    });
    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/profiles$/);
    await expect(page.getByTestId("profile-picker")).toBeVisible();
    await expect(page.getByTestId("profile-card-1")).toBeVisible();
    await expectNoAxeViolations(page, "profile picker");
  });

  test("can create a new profile and land on onboarding", async ({ page }) => {
    await page.goto("/profiles");
    await waitForRoot(page);
    await page.getByTestId("add-profile").click();
    await page.getByTestId("new-profile-name").fill("Sam");
    await page.getByTestId("avatar-owl").click();
    await page.getByTestId("create-profile-submit").click();
    await expect(page).toHaveURL(/\/onboarding$/);

    const list = (await apiGet("/api/profiles")) as Array<{ name: string; avatar: string }>;
    expect(list.map((p) => p.name)).toContain("Sam");
    expect(list.find((p) => p.name === "Sam")?.avatar).toBe("owl");
  });

  test("picking an existing onboarded profile lands on Home", async ({ page }) => {
    // Mark the seed profile as onboarded via API
    const list = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = list[0]!.id;
    const ctx = await page.context().request;
    await ctx.patch(`/api/profiles/${id}`, {
      data: { onboardedAt: new Date().toISOString() },
      headers: { "content-type": "application/json" },
    });

    await page.goto("/profiles");
    await waitForRoot(page);
    await page.getByTestId(`profile-card-${id}`).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /hey there/i })).toBeVisible();
  });

  test("stale localStorage profile id falls back to picker", async ({ page }) => {
    // Pre-set an id that doesn't exist in the DB — gate must recover.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("rq.activeProfileId", "9999");
      } catch {
        /* ignore */
      }
    });
    // Also ensure there are 2+ profiles so it can't auto-pick.
    const ctx = page.context().request;
    await ctx.post("/api/profiles", {
      headers: { "content-type": "application/json" },
      data: { name: "Robin", avatar: "bunny" },
    });
    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/profiles$/);
  });

  test("grownups extras honor x-profile-id when active profile changes", async ({ request }) => {
    // Create a second profile and log a word-help against it.
    const created = await request.post("/api/profiles", {
      headers: { "content-type": "application/json" },
      data: { name: "ScopedKid2", avatar: "moon" },
    });
    const second = (await created.json()) as { id: number };
    const worldsRes = await request.get("/api/worlds");
    const worlds = (await worldsRes.json()) as Array<{ id: number }>;
    const storiesRes = await request.get(`/api/worlds/${worlds[0]!.id}/stories`);
    const stories = (await storiesRes.json()) as Array<{ id: number }>;
    const storyRes = await request.get(`/api/stories/${stories[0]!.id}`);
    const story = (await storyRes.json()) as { chapters: Array<{ id: number }> };
    const chapterId = story.chapters[0]!.id;
    const chapterRes = await request.get(`/api/chapters/${chapterId}`);
    const chapter = (await chapterRes.json()) as { tappableWords: Array<{ key: string }> };

    const sessRes = await request.post("/api/sessions", {
      headers: { "x-profile-id": String(second.id), "content-type": "application/json" },
      data: { chapterId },
    });
    const sess = (await sessRes.json()) as { id: number };
    await request.post(`/api/sessions/${sess.id}/word-help`, {
      headers: { "x-profile-id": String(second.id), "content-type": "application/json" },
      data: { wordKey: chapter.tappableWords[0]!.key },
    });

    // Vocabulary is empty for profile 1, has the row for the second profile.
    const grownupHeader = (id: number) => ({
      "x-grownup-token": "dev-grownup-token-do-not-use-in-prod",
      "x-profile-id": String(id),
    });
    // First fetch the actual token by logging in, since prod-style token is cycled.
    const auth = await request.post("/api/grownups/auth", {
      headers: { "content-type": "application/json" },
      data: { passcode: "1234" },
    });
    const { token } = (await auth.json()) as { token: string };
    const vocab1 = await request.get("/api/grownups/vocabulary", {
      headers: { "x-grownup-token": token, "x-profile-id": "1" },
    });
    const vocab2 = await request.get("/api/grownups/vocabulary", {
      headers: { "x-grownup-token": token, "x-profile-id": String(second.id) },
    });
    const v1 = (await vocab1.json()) as Array<unknown>;
    const v2 = (await vocab2.json()) as Array<unknown>;
    expect(v1.length).toBe(0);
    expect(v2.length).toBeGreaterThan(0);
    void grownupHeader;
  });

  test("API requests for non-active profile are scoped via x-profile-id", async () => {
    // Create a second profile and mutate it via the header.
    const ctx = await (await import("@playwright/test")).request.newContext();
    const created = await ctx.post("/api/profiles", {
      data: { name: "ScopedKid", avatar: "bunny" },
      headers: { "content-type": "application/json" },
    });
    const newProfile = (await created.json()) as { id: number };
    // Hit /me with the header to verify we get this profile, not Alex.
    const me = await ctx.get("/api/me", { headers: { "x-profile-id": String(newProfile.id) } });
    const meBody = await me.json();
    expect(meBody.name).toBe("ScopedKid");
    expect(meBody.id).toBe(newProfile.id);
    // Without header we get the first profile.
    const fallback = await ctx.get("/api/me");
    const fallbackBody = await fallback.json();
    expect(fallbackBody.id).not.toBe(newProfile.id);
    await ctx.dispose();
  });
});
