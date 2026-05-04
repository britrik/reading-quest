import { Router, type IRouter } from "express";
import {
  db,
  sessionsTable,
  wordHelpEventsTable,
  finishedChaptersTable,
  storiesTable,
  chaptersTable,
  worldsTable,
} from "@workspace/db";
import { and, desc, eq, gte, sql, inArray, countDistinct } from "drizzle-orm";
import { GrownupsAuthBody } from "@workspace/api-zod";
import { resolveProfile } from "../lib/profile";
import { safeCompare } from "../lib/grownup-auth";
import rateLimit from "express-rate-limit";

const IS_E2E = process.env.ENABLE_E2E_TEST_ROUTES === "true";
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_E2E ? 100 : 5,
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router: IRouter = Router();

import { randomBytes } from "node:crypto";

const IS_PROD = process.env.NODE_ENV === "production";
if (IS_PROD && (!process.env.GROWNUPS_PASSCODE || !process.env.GROWNUPS_TOKEN_SECRET)) {
  throw new Error(
    "GROWNUPS_PASSCODE and GROWNUPS_TOKEN_SECRET environment variables are required in production.",
  );
}
const PASSCODE = process.env.GROWNUPS_PASSCODE || "1234";
const TOKEN_SECRET = process.env.GROWNUPS_TOKEN_SECRET || randomBytes(32).toString("hex");
const TOKEN = `grownup:${TOKEN_SECRET}`;

function requireGrownupAuth(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const provided = req.headers["x-grownup-token"];
  return typeof provided === "string" && safeCompare(provided, TOKEN);
}

router.post("/grownups/auth", authLimiter, (req, res) => {
  const parsed = GrownupsAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Wrong passcode" });
    return;
  }
  if (!safeCompare(parsed.data.passcode, PASSCODE)) {
    res.status(401).json({ error: "Wrong passcode" });
    return;
  }
  res.json({ token: TOKEN });
});

function gate(req: import("express").Request, res: import("express").Response): boolean {
  if (!requireGrownupAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/grownups/summary", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), gte(sessionsTable.startedAt, since)));
  const minutesRead = Math.round(sessions.reduce((acc, s) => acc + s.activeMs, 0) / 60_000);
  const sessionsCount = sessions.length;

  const finished = await db
    .select()
    .from(finishedChaptersTable)
    .where(and(eq(finishedChaptersTable.profileId, profile.id), gte(finishedChaptersTable.finishedAt, since)));
  const chaptersFinished = finished.length;

  const finishedChapterIds = finished.map((f) => f.chapterId);
  let storiesFinished = 0;
  if (finishedChapterIds.length > 0) {
    const finishedChapters = await db
      .select()
      .from(chaptersTable)
      .where(inArray(chaptersTable.id, finishedChapterIds));
    const storyIds = Array.from(new Set(finishedChapters.map((c) => c.storyId)));
    for (const sId of storyIds) {
      const allChapters = await db.select().from(chaptersTable).where(eq(chaptersTable.storyId, sId));
      const finSet = new Set(finishedChapterIds);
      if (allChapters.every((c) => finSet.has(c.id))) storiesFinished++;
    }
  }

  const wordHelpRows = await db
    .select({ uniqueWords: countDistinct(wordHelpEventsTable.wordKey) })
    .from(wordHelpEventsTable)
    .where(and(eq(wordHelpEventsTable.profileId, profile.id), gte(wordHelpEventsTable.createdAt, since)));
  const wordsHelped = Number(wordHelpRows[0]?.uniqueWords ?? 0);

  res.json({
    minutesRead,
    storiesFinished,
    chaptersFinished,
    wordsHelped,
    sessionsCount,
  });
});

router.get("/grownups/weekly-minutes", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const days: { date: string; minutes: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.profileId, profile.id),
          gte(sessionsTable.startedAt, dayStart),
          sql`${sessionsTable.startedAt} < ${dayEnd}`,
        ),
      );
    const minutes = Math.round(sessions.reduce((a, s) => a + s.activeMs, 0) / 60_000);
    days.push({ date: dayStart.toISOString().slice(0, 10), minutes });
  }
  res.json(days);
});

router.get("/grownups/words", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const rows = await db
    .select({
      wordKey: wordHelpEventsTable.wordKey,
      word: wordHelpEventsTable.word,
      count: sql<number>`count(*)::int`,
      lastAt: sql<Date>`max(${wordHelpEventsTable.createdAt})`,
    })
    .from(wordHelpEventsTable)
    .where(eq(wordHelpEventsTable.profileId, profile.id))
    .groupBy(wordHelpEventsTable.wordKey, wordHelpEventsTable.word)
    .orderBy(sql`count(*) desc`)
    .limit(20);
  res.json(
    rows.map((r) => ({
      wordKey: r.wordKey,
      word: r.word,
      helpCount: r.count,
      lastSeenAt: r.lastAt instanceof Date ? r.lastAt.toISOString() : new Date(r.lastAt).toISOString(),
    })),
  );
});

router.get("/grownups/finished-stories", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const finished = await db
    .select()
    .from(finishedChaptersTable)
    .where(eq(finishedChaptersTable.profileId, profile.id));
  if (finished.length === 0) {
    res.json([]);
    return;
  }
  const finSet = new Set(finished.map((f) => f.chapterId));
  const finishedAtByChapter = new Map(finished.map((f) => [f.chapterId, f.finishedAt]));
  const allChapters = await db.select().from(chaptersTable);
  const stories = await db.select().from(storiesTable);
  const worlds = await db.select().from(worldsTable);
  const worldById = new Map(worlds.map((w) => [w.id, w]));
  const result: { storyId: number; title: string; worldName: string; finishedAt: string }[] = [];
  for (const s of stories) {
    const chapters = allChapters.filter((c) => c.storyId === s.id);
    if (chapters.length === 0) continue;
    if (chapters.every((c) => finSet.has(c.id))) {
      const last = chapters.reduce<Date | null>((max, c) => {
        const t = finishedAtByChapter.get(c.id) ?? null;
        if (!t) return max;
        if (!max || t > max) return t;
        return max;
      }, null);
      if (last) {
        result.push({
          storyId: s.id,
          title: s.title,
          worldName: worldById.get(s.worldId)?.name ?? "Unknown",
          finishedAt: last.toISOString(),
        });
      }
    }
  }
  result.sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1));
  res.json(result);
});

router.get("/grownups/recent-activity", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);

  const finished = await db
    .select()
    .from(finishedChaptersTable)
    .where(eq(finishedChaptersTable.profileId, profile.id))
    .orderBy(desc(finishedChaptersTable.finishedAt))
    .limit(25);
  const wordEvents = await db
    .select()
    .from(wordHelpEventsTable)
    .where(eq(wordHelpEventsTable.profileId, profile.id))
    .orderBy(desc(wordHelpEventsTable.createdAt))
    .limit(25);
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.profileId, profile.id))
    .orderBy(desc(sessionsTable.startedAt))
    .limit(25);

  const chapters = await db.select().from(chaptersTable);
  const chapterById = new Map(chapters.map((c) => [c.id, c]));

  type Event = { id: number; kind: string; label: string; createdAt: string };
  const events: Event[] = [];

  for (const f of finished) {
    const c = chapterById.get(f.chapterId);
    events.push({
      id: f.id,
      kind: "chapter_finished",
      label: c ? `Finished chapter "${c.title}"` : "Finished a chapter",
      createdAt: f.finishedAt.toISOString(),
    });
  }
  for (const w of wordEvents) {
    events.push({
      id: w.id,
      kind: "word_help",
      label: `Asked for help with "${w.word}"`,
      createdAt: w.createdAt.toISOString(),
    });
  }
  for (const s of sessions) {
    events.push({
      id: s.id,
      kind: "session_started",
      label: `Opened a chapter`,
      createdAt: s.startedAt.toISOString(),
    });
  }
  events.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(events.slice(0, 25));
});

router.post("/grownups/weekly-summary/send", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  // We do not currently have an email integration wired in. We persist the
  // opt-in (see preferences) so a future scheduled job can send. For now we
  // tell the client we are not configured so it can offer the printable
  // (browser print-to-PDF) fallback. This is intentional, not silent.
  res.status(501).json({
    ok: false,
    reason: "email_not_configured",
    fallback: "/api/grownups/weekly-summary/printable",
    message:
      "Email delivery is not yet configured for this deployment. Use the printable summary as a PDF fallback (browser print → save as PDF).",
    profileId: profile.id,
  });
});

router.get("/grownups/weekly-summary/printable", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), gte(sessionsTable.startedAt, since)));
  const minutesRead = Math.round(sessions.reduce((acc, s) => acc + s.activeMs, 0) / 60_000);

  const finished = await db
    .select()
    .from(finishedChaptersTable)
    .where(and(eq(finishedChaptersTable.profileId, profile.id), gte(finishedChaptersTable.finishedAt, since)));

  const wordsHelpedRow = await db
    .select({ uniqueWords: countDistinct(wordHelpEventsTable.wordKey) })
    .from(wordHelpEventsTable)
    .where(and(eq(wordHelpEventsTable.profileId, profile.id), gte(wordHelpEventsTable.createdAt, since)));
  const wordsHelped = Number(wordHelpsRowSafe(wordsHelpedRow));

  res
    .setHeader("content-type", "text/html; charset=utf-8")
    .send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Reading Quest — Weekly summary for ${escapeHtml(profile.name)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 2rem auto; padding: 1rem; color: #2D3142; }
  h1 { font-size: 1.6rem; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  .stat { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; }
  .num { font-size: 2rem; font-weight: 700; color: #FF9B54; }
  @media print { .noprint { display: none; } }
</style></head>
<body>
  <h1>Weekly summary for ${escapeHtml(profile.name)}</h1>
  <p>Past 7 days, ending ${new Date().toLocaleDateString()}.</p>
  <div class="stats">
    <div class="stat"><div class="num">${minutesRead}</div><div>minutes read</div></div>
    <div class="stat"><div class="num">${finished.length}</div><div>chapters finished</div></div>
    <div class="stat"><div class="num">${sessions.length}</div><div>reading sessions</div></div>
    <div class="stat"><div class="num">${wordsHelped}</div><div>unique words helped</div></div>
  </div>
  <p>Tip: use your browser's <strong>Print → Save as PDF</strong> to keep a copy.</p>
  <button class="noprint" onclick="window.print()">Print / Save as PDF</button>
</body></html>`);
});

function wordHelpsRowSafe(rows: Array<{ uniqueWords: number | string | null }>): number {
  return Number(rows[0]?.uniqueWords ?? 0);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

export default router;
