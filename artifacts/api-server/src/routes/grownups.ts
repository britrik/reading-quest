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
import { and, desc, eq, gte, sql, inArray } from "drizzle-orm";
import { GrownupsAuthBody } from "@workspace/api-zod";
import { getOrCreateActiveProfile } from "../lib/profile";

const router: IRouter = Router();

const PASSCODE = process.env.GROWNUPS_PASSCODE || "1234";
const TOKEN = `grownup:${process.env.GROWNUPS_TOKEN_SECRET || "rq-grownups-token"}`;

function requireGrownupAuth(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const provided = req.headers["x-grownup-token"];
  return typeof provided === "string" && provided === TOKEN;
}

router.post("/grownups/auth", (req, res) => {
  const parsed = GrownupsAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Wrong passcode" });
    return;
  }
  if (parsed.data.passcode !== PASSCODE) {
    res.status(401).json({ error: "Wrong passcode" });
    return;
  }
  res.json({ token: TOKEN });
});

function gate(req: any, res: any) {
  if (!requireGrownupAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/grownups/summary", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await getOrCreateActiveProfile();
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

  const wordHelps = await db
    .select()
    .from(wordHelpEventsTable)
    .where(and(eq(wordHelpEventsTable.profileId, profile.id), gte(wordHelpEventsTable.createdAt, since)));

  res.json({
    minutesRead,
    storiesFinished,
    chaptersFinished,
    wordsHelped: wordHelps.length,
    sessionsCount,
  });
});

router.get("/grownups/weekly-minutes", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await getOrCreateActiveProfile();
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
  const profile = await getOrCreateActiveProfile();
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
  const profile = await getOrCreateActiveProfile();
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
  const profile = await getOrCreateActiveProfile();

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

export default router;
