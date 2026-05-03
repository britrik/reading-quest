import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import router from "./index";
import { seed } from "../seed";

let app: express.Express;

interface TestResponse<T> {
  status: number;
  body: T;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<TestResponse<T>> {
  return new Promise<TestResponse<T>>((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${addr.port}${path}`;
      fetch(url, {
        method,
        headers: { "content-type": "application/json", ...(headers ?? {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
        .then(async (r) => {
          const text = await r.text();
          let parsed: unknown = null;
          try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
          server.close();
          resolve({ status: r.status, body: parsed as T });
        })
        .catch((err) => { server.close(); reject(err); });
    });
  });
}

interface World { id: number; slug: string; name: string }
interface Story { id: number; title: string; chapterCount: number }
interface Profile { id: number; name: string; gems: number; stars: number; petXpForNextLevel: number }
interface Pet { mood: "ecstatic" | "happy" | "okay" | "lonely" }
interface ShopItem { id: string; locked: boolean; owned: boolean }
interface Session { id: number; chapterId: number; status: string; activeMs: number }
interface FinishResponse { session: Session; gemsAwarded: number; starsAwarded: number; xpAwarded: number }
interface AuthResponse { token: string }
interface Summary { minutesRead: number; sessionsCount: number }
interface Word { word: string; lastSeenAt: string }
interface FinishedStory { id: number; title: string; worldName: string }
interface RecentActivity { id: string; kind: string; label: string; createdAt: string }

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use("/api", router);
  await seed();
});

describe("worlds routes", () => {
  it("GET /api/worlds returns seeded worlds", async () => {
    const r = await request<World[]>("GET", "/api/worlds");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.length).toBeGreaterThanOrEqual(3);
    expect(r.body[0]).toHaveProperty("slug");
  });

  it("GET /api/worlds/:id/stories returns stories", async () => {
    const r = await request<Story[]>("GET", "/api/worlds/1/stories");
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body[0]).toHaveProperty("chapterCount");
  });

  it("GET /api/worlds/9999/stories 404s", async () => {
    const r = await request("GET", "/api/worlds/9999/stories");
    expect(r.status).toBe(404);
  });
});

describe("me + pet routes", () => {
  it("GET /api/me returns the singleton profile", async () => {
    const r = await request<Profile>("GET", "/api/me");
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("name");
    expect(typeof r.body.gems).toBe("number");
    expect(typeof r.body.petXpForNextLevel).toBe("number");
  });

  it("GET /api/pet has mood + xp progress", async () => {
    const r = await request<Pet>("GET", "/api/pet");
    expect(r.status).toBe(200);
    expect(["ecstatic", "happy", "okay", "lonely"]).toContain(r.body.mood);
  });

  it("GET /api/shop lists items with owned + locked flags", async () => {
    const r = await request<ShopItem[]>("GET", "/api/shop");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body[0]).toHaveProperty("locked");
    expect(r.body[0]).toHaveProperty("owned");
  });
});

describe("session lifecycle", () => {
  it("rejects invalid chapterId on start", async () => {
    const r = await request("POST", "/api/sessions", { chapterId: 999999 });
    expect(r.status).toBe(400);
  });

  it("starts → heartbeat clamps → finish; second finish is no-op", async () => {
    const start = await request<Session>("POST", "/api/sessions", { chapterId: 1 });
    expect(start.status).toBe(201);
    const sid = start.body.id;
    const meBefore = await request<Profile>("GET", "/api/me");

    const hb = await request<Session>("POST", `/api/sessions/${sid}/heartbeat`, { activeMsDelta: 999999 });
    expect(hb.status).toBe(200);
    expect(hb.body.activeMs).toBeLessThanOrEqual(30_000);

    const finish = await request<FinishResponse>("POST", `/api/sessions/${sid}/finish`);
    expect(finish.status).toBe(200);
    expect(finish.body.session.status).toBe("finished");

    const finishAgain = await request<FinishResponse>("POST", `/api/sessions/${sid}/finish`);
    expect(finishAgain.body.gemsAwarded).toBe(0);
    expect(finishAgain.body.starsAwarded).toBe(0);

    const meAfter = await request<Profile>("GET", "/api/me");
    expect(meAfter.body.gems).toBeGreaterThanOrEqual(meBefore.body.gems);
  });

  it("heartbeat on unknown session returns 404", async () => {
    const r = await request("POST", "/api/sessions/999999/heartbeat", { activeMsDelta: 1000 });
    expect(r.status).toBe(404);
  });
});

describe("grownups auth + payload contracts", () => {
  it("rejects wrong passcode", async () => {
    const r = await request("POST", "/api/grownups/auth", { passcode: "wrong" });
    expect(r.status).toBe(401);
  });

  it("rejects missing token on protected route", async () => {
    const r = await request("GET", "/api/grownups/summary");
    expect(r.status).toBe(401);
  });

  it("returns OpenAPI-shaped payloads when authenticated", async () => {
    const auth = await request<AuthResponse>("POST", "/api/grownups/auth", { passcode: "1234" });
    expect(auth.status).toBe(200);
    const token = auth.body.token;

    const summary = await request<Summary>("GET", "/api/grownups/summary", undefined, { "x-grownup-token": token });
    expect(summary.status).toBe(200);
    expect(summary.body).toHaveProperty("minutesRead");

    const words = await request<Word[]>("GET", "/api/grownups/words", undefined, { "x-grownup-token": token });
    expect(words.status).toBe(200);
    if (words.body.length > 0) {
      expect(words.body[0]).toHaveProperty("lastSeenAt");
    }

    const finished = await request<FinishedStory[]>("GET", "/api/grownups/finished-stories", undefined, { "x-grownup-token": token });
    expect(finished.status).toBe(200);
    if (finished.body.length > 0) {
      expect(finished.body[0]).toHaveProperty("title");
      expect(finished.body[0]).toHaveProperty("worldName");
    }

    const recent = await request<RecentActivity[]>("GET", "/api/grownups/recent-activity", undefined, { "x-grownup-token": token });
    expect(recent.status).toBe(200);
    if (recent.body.length > 0) {
      expect(recent.body[0]).toHaveProperty("id");
      expect(recent.body[0]).toHaveProperty("kind");
      expect(recent.body[0]).toHaveProperty("label");
      expect(recent.body[0]).toHaveProperty("createdAt");
    }
  });

  it("rejects predictable bypass token", async () => {
    const r = await request("GET", "/api/grownups/summary", undefined, {
      "x-grownup-token": "grownup:rq-grownups-token",
    });
    expect(r.status).toBe(401);
  });
});

interface ProfileRow {
  id: number;
  name: string;
  avatar: string;
  companion: string | null;
  gems: number;
  stars: number;
  onboarded: boolean;
}
interface PrefsRow {
  voiceSpeed: number;
  sessionLengthSuggestionMin: number;
  breakReminders: boolean;
  weeklyEmailOptIn: boolean;
  weeklyEmailAddress: string | null;
}

const GROWNUP = { "x-grownup-token": "grownup:test-integration" };

describe("profiles CRUD + grown-ups gate", () => {
  it("rejects POST /api/profiles without a grown-ups token", async () => {
    const r = await request("POST", "/api/profiles", { name: "Nope" });
    expect(r.status).toBe(401);
  });

  it("creates a profile when the token is present and rejects identity edits without it", async () => {
    const created = await request<ProfileRow>("POST", "/api/profiles", { name: "Quinn", avatar: "owl" }, GROWNUP);
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Quinn");
    expect(created.body.onboarded).toBe(false);

    // Renaming requires the token.
    const unauthRename = await request("PATCH", `/api/profiles/${created.body.id}`, { name: "Renamed" });
    expect(unauthRename.status).toBe(401);

    const renamed = await request<ProfileRow>(
      "PATCH", `/api/profiles/${created.body.id}`, { name: "Renamed" }, GROWNUP,
    );
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe("Renamed");

    // Companion + onboardedAt are kid-callable (no token), and the kid app may
    // also set its name in the same PATCH that completes onboarding.
    const kidPatch = await request<ProfileRow>("PATCH", `/api/profiles/${created.body.id}`, {
      name: "Quincy",
      companion: "fox",
      onboardedAt: new Date().toISOString(),
    });
    expect(kidPatch.status).toBe(200);
    expect(kidPatch.body.name).toBe("Quincy");
    expect(kidPatch.body.companion).toBe("fox");
    expect(kidPatch.body.onboarded).toBe(true);

    // After onboarding, name changes require the grown-up token again.
    const renameAfter = await request("PATCH", `/api/profiles/${created.body.id}`, { name: "Sneaky" });
    expect(renameAfter.status).toBe(401);

    // Bypass attempt: kid resends `onboardedAt` along with a name change after
    // the profile is already onboarded. Server must still reject because the
    // existing row already has onboardedAt set; the carve-out is for first-time
    // onboarding only.
    const sneaky = await request("PATCH", `/api/profiles/${created.body.id}`, {
      name: "Sneakier",
      onboardedAt: new Date().toISOString(),
    });
    expect(sneaky.status).toBe(401);

    // Delete requires the token.
    const unauthDel = await request("DELETE", `/api/profiles/${created.body.id}`);
    expect(unauthDel.status).toBe(401);
    const del = await request("DELETE", `/api/profiles/${created.body.id}`, undefined, GROWNUP);
    expect(del.status).toBe(200);
  });

  it("refuses to delete the last remaining profile", async () => {
    // Make sure we are down to 1 profile by clearing extras created above.
    const list = await request<ProfileRow[]>("GET", "/api/profiles");
    while (list.body.length > 1) {
      const target = list.body.pop()!;
      await request("DELETE", `/api/profiles/${target.id}`, undefined, GROWNUP);
    }
    const after = await request<ProfileRow[]>("GET", "/api/profiles");
    expect(after.body.length).toBe(1);
    const r = await request("DELETE", `/api/profiles/${after.body[0]!.id}`, undefined, GROWNUP);
    expect(r.status).toBe(400);
  });
});

describe("preferences GET/PUT including grown-ups extras", () => {
  it("round-trips weekly email opt-in and address", async () => {
    const list = await request<ProfileRow[]>("GET", "/api/profiles");
    const id = list.body[0]!.id;
    const headers = { "x-profile-id": String(id) };

    // Reset to a known starting state — tests above this one may have left
    // weekly-email prefs set via summary fixtures.
    await request<PrefsRow>("PUT", "/api/preferences", {
      weeklyEmailOptIn: false,
      weeklyEmailAddress: "",
    }, { ...headers, ...GROWNUP });
    // Reads of grown-up-only fields require the grown-up token (privacy:
    // we don't want a kid to see the parent's weekly-email address).
    const before = await request<PrefsRow>("GET", "/api/preferences", undefined, { ...headers, ...GROWNUP });
    expect(before.status).toBe(200);
    expect(before.body.weeklyEmailOptIn).toBe(false);
    expect(before.body.weeklyEmailAddress).toBeNull();

    const put = await request<PrefsRow>("PUT", "/api/preferences", {
      weeklyEmailOptIn: true,
      weeklyEmailAddress: "grown@example.com",
      sessionLengthSuggestionMin: 25,
      breakReminders: false,
    }, { ...headers, ...GROWNUP });
    expect(put.status).toBe(200);
    expect(put.body.weeklyEmailOptIn).toBe(true);
    expect(put.body.weeklyEmailAddress).toBe("grown@example.com");
    expect(put.body.sessionLengthSuggestionMin).toBe(25);
    expect(put.body.breakReminders).toBe(false);

    // Empty string clears the address back to null.
    const cleared = await request<PrefsRow>("PUT", "/api/preferences", {
      weeklyEmailAddress: "",
    }, { ...headers, ...GROWNUP });
    expect(cleared.body.weeklyEmailAddress).toBeNull();
  });
});

interface UnlockResponse { ok: boolean; alreadyUnlocked: boolean; gemsRemaining: number }
interface StoryRow { id: number; title: string; chapterCount: number; gemUnlockCost: number; unlocked: boolean }
interface MeRow { id: number; name: string; gems: number }

describe("preferences grown-up auth split", () => {
  it("rejects writes to grown-up-only fields without the token", async () => {
    const list = await request<ProfileRow[]>("GET", "/api/profiles");
    const id = list.body[0]!.id;
    const headers = { "x-profile-id": String(id) };

    // Kid fields (incl. voiceSpeed — a kid-comfort setting in Cozy Settings)
    // go through fine without a token.
    const kidOk = await request("PUT", "/api/preferences", { fontSize: "large" }, headers);
    expect(kidOk.status).toBe(200);
    const kidVoice = await request<PrefsRow>("PUT", "/api/preferences", { voiceSpeed: 1.1 }, headers);
    expect(kidVoice.status).toBe(200);
    expect(kidVoice.body.voiceSpeed).toBeCloseTo(1.1, 1);

    // GET without the token must omit grown-up fields (privacy).
    const kidRead = await request<Record<string, unknown>>("GET", "/api/preferences", undefined, headers);
    expect(kidRead.status).toBe(200);
    expect(kidRead.body.voiceSpeed).toBeCloseTo(1.1, 1);
    expect(kidRead.body.weeklyEmailAddress).toBeUndefined();
    expect(kidRead.body.weeklyEmailOptIn).toBeUndefined();
    expect(kidRead.body.breakReminders).toBeUndefined();

    // Grown-up fields are 401 without the token.
    const blocked = await request("PUT", "/api/preferences", { breakReminders: false }, headers);
    expect(blocked.status).toBe(401);

    const blocked2 = await request("PUT", "/api/preferences", { weeklyEmailOptIn: true }, headers);
    expect(blocked2.status).toBe(401);

    // Same payload with the grown-ups token succeeds.
    const ok = await request<PrefsRow>(
      "PUT",
      "/api/preferences",
      { breakReminders: false, weeklyEmailOptIn: true },
      { ...headers, ...GROWNUP },
    );
    expect(ok.status).toBe(200);
    expect(ok.body.breakReminders).toBe(false);
    expect(ok.body.weeklyEmailOptIn).toBe(true);
  });
});

describe("story unlock with gems", () => {
  it("seeds the first story per world as free and locks the rest behind gems", async () => {
    const r = await request<StoryRow[]>("GET", "/api/worlds/1/stories");
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThanOrEqual(3);
    expect(r.body[0]!.unlocked).toBe(true);
    expect(r.body[0]!.gemUnlockCost).toBe(0);
    expect(r.body[1]!.unlocked).toBe(false);
    expect(r.body[1]!.gemUnlockCost).toBeGreaterThan(0);
  });

  it("spends gems and marks the story unlocked", async () => {
    // Make sure the active profile has plenty of gems.
    const list = await request<ProfileRow[]>("GET", "/api/profiles");
    const id = list.body[0]!.id;
    const headers = { "x-profile-id": String(id) };
    const stories = await request<StoryRow[]>("GET", "/api/worlds/1/stories", undefined, headers);
    const locked = stories.body.find((s) => !s.unlocked);
    expect(locked).toBeDefined();

    const unlock = await request<UnlockResponse>("POST", `/api/stories/${locked!.id}/unlock`, undefined, headers);
    expect(unlock.status).toBe(200);
    expect(unlock.body.ok).toBe(true);
    expect(unlock.body.alreadyUnlocked).toBe(false);

    const after = await request<StoryRow[]>("GET", "/api/worlds/1/stories", undefined, headers);
    const sameStory = after.body.find((s) => s.id === locked!.id);
    expect(sameStory?.unlocked).toBe(true);

    // A second unlock attempt is a no-op (no extra spend).
    const again = await request<UnlockResponse>("POST", `/api/stories/${locked!.id}/unlock`, undefined, headers);
    expect(again.body.alreadyUnlocked).toBe(true);
  });

  it("refuses to unlock when the profile cannot afford it", async () => {
    // Drain the profile's gems to 0 first.
    const list = await request<ProfileRow[]>("GET", "/api/profiles");
    const id = list.body[0]!.id;
    const headers = { "x-profile-id": String(id) };
    // Use the test reset endpoint isn't available here; instead just set gems
    // directly via a few unlocks until we get a 400. Easier: pick the most
    // expensive story in another world after spending what we have.
    const me = await request<MeRow>("GET", "/api/me", undefined, headers);
    if (me.body.gems > 0) {
      // Spend on the cheapest available locked story to drain.
      for (let w = 2; w <= 6 && me.body.gems > 0; w++) {
        const ws = await request<StoryRow[]>("GET", `/api/worlds/${w}/stories`, undefined, headers);
        for (const s of ws.body) {
          if (!s.unlocked) {
            await request<UnlockResponse>("POST", `/api/stories/${s.id}/unlock`, undefined, headers);
          }
        }
        const meNow = await request<MeRow>("GET", "/api/me", undefined, headers);
        if (meNow.body.gems === 0) break;
      }
    }
    // Find a still-locked story.
    let stillLocked: StoryRow | undefined;
    for (let w = 1; w <= 6 && !stillLocked; w++) {
      const ws = await request<StoryRow[]>("GET", `/api/worlds/${w}/stories`, undefined, headers);
      stillLocked = ws.body.find((s) => !s.unlocked);
    }
    if (stillLocked) {
      const r = await request("POST", `/api/stories/${stillLocked.id}/unlock`, undefined, headers);
      expect(r.status).toBe(400);
    }
  });
});

describe("weekly summary delivery", () => {
  // The grownups router validates the strict per-process token from
  // /api/grownups/auth (not the dev "grownup:*" fallback the rest of the
  // tests use), so we mint one for this suite.
  let realToken: Record<string, string>;
  beforeAll(async () => {
    const auth = await request<AuthResponse>("POST", "/api/grownups/auth", { passcode: "1234" });
    realToken = { "x-grownup-token": auth.body.token };
  });

  it("send returns 501 not_configured (and points to the printable fallback)", async () => {
    const r = await request<{ reason: string; fallback: string }>(
      "POST", "/api/grownups/weekly-summary/send", undefined, realToken,
    );
    expect(r.status).toBe(501);
    expect(r.body.reason).toBe("email_not_configured");
    expect(r.body.fallback).toContain("/grownups/weekly-summary/printable");
  });

  it("printable summary returns HTML for the active reader", async () => {
    const r = await request<string>("GET", "/api/grownups/weekly-summary/printable", undefined, realToken);
    expect(r.status).toBe(200);
    expect(typeof r.body).toBe("string");
    expect(r.body).toContain("<html");
    expect(r.body).toContain("Weekly summary");
  });

  it("printable + send both 401 without grown-ups token", async () => {
    const a = await request("GET", "/api/grownups/weekly-summary/printable");
    const b = await request("POST", "/api/grownups/weekly-summary/send");
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
  });
});

describe("seed library size", () => {
  it("ships at least 6 worlds, each with >= 3 stories of >= 5 chapters", async () => {
    const worlds = await request<World[]>("GET", "/api/worlds");
    expect(worlds.body.length).toBeGreaterThanOrEqual(6);
    for (const w of worlds.body) {
      const stories = await request<Story[]>("GET", `/api/worlds/${w.id}/stories`);
      expect(stories.body.length, `world ${w.slug}`).toBeGreaterThanOrEqual(3);
      for (const s of stories.body) {
        expect(s.chapterCount, `story ${s.title}`).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
