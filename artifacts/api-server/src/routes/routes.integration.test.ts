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
