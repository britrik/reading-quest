import { Router, type IRouter } from "express";
import {
  db,
  childProfilesTable,
  preferencesTable,
  sessionsTable,
  wordHelpEventsTable,
  finishedChaptersTable,
  ownedItemsTable,
  decorStateTable,
  transactionsTable,
  chaptersTable,
  storiesTable,
  worldsTable,
} from "@workspace/db";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { resolveProfile } from "../lib/profile";

const router: IRouter = Router();

const IS_PROD = process.env.NODE_ENV === "production";
const PASSCODE_SECRET = process.env.GROWNUPS_TOKEN_SECRET || "";
const PASSCODE = process.env.GROWNUPS_PASSCODE || "1234";
const TOKEN = `grownup:${PASSCODE_SECRET || PASSCODE}`;

function gate(req: import("express").Request, res: import("express").Response): boolean {
  const provided = req.header("x-grownup-token");
  if (!provided || (IS_PROD ? provided !== TOKEN : !provided.startsWith("grownup:"))) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/**
 * Per-word vocabulary tracker. For each unique word the kid asked help with,
 * compute (a) how many times they asked for help, (b) when they last asked,
 * and (c) a "learned" hint: did the same word appear in a later session
 * without a help request? Since we don't track every word read, we proxy
 * "later success" as: at least one chapter session was finished AFTER the
 * most recent help request for this word, and there has been no further
 * help request for the word since.
 */
router.get("/grownups/vocabulary", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);

  const wordRows = await db
    .select({
      wordKey: wordHelpEventsTable.wordKey,
      word: wordHelpEventsTable.word,
      helpCount: sql<number>`count(*)::int`,
      lastHelpAt: sql<Date>`max(${wordHelpEventsTable.createdAt})`,
    })
    .from(wordHelpEventsTable)
    .where(eq(wordHelpEventsTable.profileId, profile.id))
    .groupBy(wordHelpEventsTable.wordKey, wordHelpEventsTable.word)
    .orderBy(desc(sql`max(${wordHelpEventsTable.createdAt})`));

  // Subsequent successful sessions: any session that ended after lastHelpAt with status=finished.
  const finishedSessions = await db
    .select({ endedAt: sessionsTable.endedAt })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), eq(sessionsTable.status, "finished")));

  const finishedTimes = finishedSessions
    .map((s) => s.endedAt)
    .filter((t): t is Date => t instanceof Date)
    .map((t) => t.getTime())
    .sort((a, b) => a - b);

  res.json(
    wordRows.map((r) => {
      const lastHelp = r.lastHelpAt instanceof Date ? r.lastHelpAt : new Date(r.lastHelpAt);
      const subsequentReads = finishedTimes.filter((t) => t > lastHelp.getTime()).length;
      const status =
        subsequentReads >= 2 ? "learned" : subsequentReads >= 1 ? "practicing" : "new";
      return {
        wordKey: r.wordKey,
        word: r.word,
        helpCount: r.helpCount,
        lastHelpAt: lastHelp.toISOString(),
        subsequentReads,
        status,
      };
    }),
  );
});

/**
 * Plain-language "what to celebrate this week" auto-summary.
 * Streak-free, judgment-free.
 */
router.get("/grownups/weekly-summary", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), gte(sessionsTable.startedAt, weekAgo)));
  const minutes = Math.round(sessions.reduce((a, s) => a + s.activeMs, 0) / 60_000);
  const sessionDays = new Set(
    sessions.map((s) => s.startedAt.toISOString().slice(0, 10)),
  ).size;

  const finished = await db
    .select()
    .from(finishedChaptersTable)
    .where(
      and(
        eq(finishedChaptersTable.profileId, profile.id),
        gte(finishedChaptersTable.finishedAt, weekAgo),
      ),
    );

  const wordsTapped = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wordHelpEventsTable)
    .where(
      and(
        eq(wordHelpEventsTable.profileId, profile.id),
        gte(wordHelpEventsTable.createdAt, weekAgo),
      ),
    );
  const tapped = Number(wordsTapped[0]?.count ?? 0);

  const highlights: string[] = [];
  if (minutes > 0) highlights.push(`Spent ${minutes} minute${minutes === 1 ? "" : "s"} reading this week`);
  if (sessionDays > 0) highlights.push(`Picked up a story on ${sessionDays} different day${sessionDays === 1 ? "" : "s"}`);
  if (finished.length > 0)
    highlights.push(`Finished ${finished.length} chapter${finished.length === 1 ? "" : "s"} — that's a real ending`);
  if (tapped > 0)
    highlights.push(
      `Asked for help with ${tapped} word${tapped === 1 ? "" : "s"} — curiosity is the goal, not avoidance`,
    );
  if (highlights.length === 0)
    highlights.push("No reading this week, and that's okay. Stories will be here when they're wanted.");

  res.json({
    minutesRead: minutes,
    daysActive: sessionDays,
    chaptersFinished: finished.length,
    wordsTapped: tapped,
    highlights,
  });
});

/**
 * Privacy-friendly data export: returns everything stored for this profile.
 */
router.get("/grownups/export", async (req, res) => {
  if (!gate(req, res)) return;
  const profile = await resolveProfile(req);

  const [prefs, sessions, words, finished, owned, decor, txns, allChapters, allStories, allWorlds] = await Promise.all([
    db.select().from(preferencesTable).where(eq(preferencesTable.profileId, profile.id)),
    db.select().from(sessionsTable).where(eq(sessionsTable.profileId, profile.id)),
    db.select().from(wordHelpEventsTable).where(eq(wordHelpEventsTable.profileId, profile.id)),
    db.select().from(finishedChaptersTable).where(eq(finishedChaptersTable.profileId, profile.id)),
    db.select().from(ownedItemsTable).where(eq(ownedItemsTable.profileId, profile.id)),
    db.select().from(decorStateTable).where(eq(decorStateTable.profileId, profile.id)),
    db.select().from(transactionsTable).where(eq(transactionsTable.profileId, profile.id)),
    db.select().from(chaptersTable),
    db.select().from(storiesTable),
    db.select().from(worldsTable),
  ]);

  const chapterById = new Map(allChapters.map((c) => [c.id, c]));
  const storyById = new Map(allStories.map((s) => [s.id, s]));
  const worldById = new Map(allWorlds.map((w) => [w.id, w]));

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      gems: profile.gems,
      stars: profile.stars,
      petLevel: profile.petLevel,
      petXp: profile.petXp,
      onboardedAt: profile.onboardedAt?.toISOString() ?? null,
      createdAt: profile.createdAt?.toISOString() ?? null,
    },
    preferences: prefs[0] ?? null,
    sessions: sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      chapterTitle: chapterById.get(s.chapterId)?.title ?? null,
      storyTitle: storyById.get(s.storyId)?.title ?? null,
    })),
    wordHelpEvents: words.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() })),
    finishedChapters: finished.map((f) => {
      const chapter = chapterById.get(f.chapterId);
      const story = chapter ? storyById.get(chapter.storyId) : undefined;
      return {
        ...f,
        finishedAt: f.finishedAt.toISOString(),
        chapterTitle: chapter?.title ?? null,
        storyTitle: story?.title ?? null,
        worldName: story ? worldById.get(story.worldId)?.name ?? null : null,
      };
    }),
    ownedItems: owned,
    decor,
    transactions: txns.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };

  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader(
    "content-disposition",
    `attachment; filename="reading-quest-${profile.name.replace(/[^a-z0-9]+/gi, "-")}-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  res.send(JSON.stringify(payload, null, 2));
});

export default router;
