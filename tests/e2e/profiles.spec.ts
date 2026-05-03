import { test, expect } from "@playwright/test";
import { apiGet, expectNoAxeViolations, resetTestProfile, waitForRoot } from "./helpers";

const GROWNUP_HEADER = { "x-grownup-token": "grownup:e2e-token", "content-type": "application/json" };

test.describe("Multi-profile system", () => {
  test.beforeEach(async () => {
    await resetTestProfile({ onboarded: false });
  });

  test("with multiple profiles, cold start redirects to picker", async ({ page, request }) => {
    await request.post("/api/profiles", {
      headers: GROWNUP_HEADER,
      data: { name: "Cleo", avatar: "owl" },
    });
    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/profiles$/);
    await expect(page.getByTestId("profile-picker")).toBeVisible();
    await expect(page.getByTestId("profile-card-1")).toBeVisible();
    await expectNoAxeViolations(page, "profile picker");
  });

  test("picker has no create UI; offers a grown-ups link instead", async ({ page }) => {
    await page.goto("/profiles");
    await waitForRoot(page);
    await expect(page.getByTestId("add-profile")).toHaveCount(0);
    await expect(page.getByTestId("picker-add-via-grownups")).toBeVisible();
  });

  test("creating a profile via the API requires the grown-ups token", async ({ request }) => {
    const unauth = await request.post("/api/profiles", {
      headers: { "content-type": "application/json" },
      data: { name: "Mallory", avatar: "owl" },
    });
    expect(unauth.status()).toBe(401);

    const ok = await request.post("/api/profiles", {
      headers: GROWNUP_HEADER,
      data: { name: "Sam", avatar: "owl" },
    });
    expect(ok.status()).toBe(201);
    const list = (await apiGet("/api/profiles")) as Array<{ name: string; avatar: string }>;
    expect(list.map((p) => p.name)).toContain("Sam");
  });

  test("picking a freshly-created (non-onboarded) profile lands on onboarding", async ({ page, request }) => {
    const created = await request.post("/api/profiles", {
      headers: GROWNUP_HEADER,
      data: { name: "Sam", avatar: "owl" },
    });
    const sam = (await created.json()) as { id: number };
    await page.goto("/profiles");
    await waitForRoot(page);
    await page.getByTestId(`profile-card-${sam.id}`).click();
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test("picking an existing onboarded profile lands on Home", async ({ page }) => {
    const list = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = list[0]!.id;
    const ctx = await page.context().request;
    // onboardedAt patch is allowed for the kid app — no token required.
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

  test("renaming a profile requires the grown-ups token", async ({ request }) => {
    const list = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = list[0]!.id;

    const unauth = await request.patch(`/api/profiles/${id}`, {
      headers: { "content-type": "application/json" },
      data: { name: "NotAllowed" },
    });
    expect(unauth.status()).toBe(401);

    const ok = await request.patch(`/api/profiles/${id}`, {
      headers: GROWNUP_HEADER,
      data: { name: "Renamed" },
    });
    expect(ok.ok()).toBe(true);
    const after = (await apiGet("/api/profiles")) as Array<{ id: number; name: string }>;
    expect(after.find((p) => p.id === id)?.name).toBe("Renamed");
  });

  test("deleting the last profile is forbidden", async ({ request }) => {
    const list = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = list[0]!.id;
    const res = await request.delete(`/api/profiles/${id}`, { headers: { "x-grownup-token": "grownup:e2e-token" } });
    expect(res.status()).toBe(400);
  });

  test("kid app may set companion + onboardedAt without a grown-ups token", async ({ request }) => {
    const list = (await apiGet("/api/profiles")) as Array<{ id: number }>;
    const id = list[0]!.id;
    const res = await request.patch(`/api/profiles/${id}`, {
      headers: { "content-type": "application/json" },
      data: { companion: "owl", onboardedAt: new Date().toISOString() },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.companion).toBe("owl");
    expect(body.onboarded).toBe(true);
  });

  test("stale localStorage profile id falls back to picker", async ({ page, request }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("rq.activeProfileId", "9999");
      } catch {
        /* ignore */
      }
    });
    await request.post("/api/profiles", {
      headers: GROWNUP_HEADER,
      data: { name: "Robin", avatar: "bunny" },
    });
    await page.goto("/");
    await waitForRoot(page);
    await expect(page).toHaveURL(/\/profiles$/);
  });

  test("grownups extras honor x-profile-id when active profile changes", async ({ request }) => {
    const created = await request.post("/api/profiles", {
      headers: GROWNUP_HEADER,
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
  });

  test("API requests for non-active profile are scoped via x-profile-id", async () => {
    const ctx = await (await import("@playwright/test")).request.newContext();
    const created = await ctx.post("/api/profiles", {
      data: { name: "ScopedKid", avatar: "bunny" },
      headers: GROWNUP_HEADER,
    });
    const newProfile = (await created.json()) as { id: number };
    const me = await ctx.get("/api/me", { headers: { "x-profile-id": String(newProfile.id) } });
    const meBody = await me.json();
    expect(meBody.name).toBe("ScopedKid");
    expect(meBody.id).toBe(newProfile.id);
    const fallback = await ctx.get("/api/me");
    const fallbackBody = await fallback.json();
    expect(fallbackBody.id).not.toBe(newProfile.id);
    await ctx.dispose();
  });
});
