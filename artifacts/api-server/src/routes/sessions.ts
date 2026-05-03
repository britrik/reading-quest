import { Router, type IRouter } from "express";
import {
  db,
  sessionsTable,
  wordHelpEventsTable,
  chaptersTable,
  finishedChaptersTable,
  childProfilesTable,
  transactionsTable,
} from "@workspace/db";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import {
  StartSessionBody,
  HeartbeatSessionBody,
  LogWordHelpBody,
} from "@workspace/api-zod";
import {
  reloadProfile,
  resolveProfile,
  xpForNextLevel,
  xpProgressPercent,
} from "../lib/profile";

const router: IRouter = Router();

const HEARTBEAT_MAX_DELTA = 30_000;

function serializeSession(s: typeof sessionsTable.$inferSelect) {
  return {
    id: s.id,
    profileId: s.profileId,
    chapterId: s.chapterId,
    storyId: s.storyId,
    startedAt: s.startedAt.toISOString(),
    activeMs: s.activeMs,
    status: s.status,
  };
}

router.post("/sessions", async (req, res) => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { chapterId } = parsed.data;
  const chapter = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId)).limit(1);
  if (chapter.length === 0) {
    res.status(400).json({ error: "Chapter not found" });
    return;
  }
  const profile = await resolveProfile(req);

  // Reuse an active session for the same chapter if it exists
  const existing = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.profileId, profile.id),
        eq(sessionsTable.chapterId, chapterId),
        inArray(sessionsTable.status, ["active", "paused"] as string[]),
      ),
    )
    .limit(1);

  // Pause any other active session for this profile
  await db
    .update(sessionsTable)
    .set({ status: "paused" })
    .where(
      and(
        eq(sessionsTable.profileId, profile.id),
        eq(sessionsTable.status, "active"),
        ne(sessionsTable.chapterId, chapterId),
      ),
    );

  if (existing.length > 0) {
    const updated = await db
      .update(sessionsTable)
      .set({ status: "active" })
      .where(eq(sessionsTable.id, existing[0]!.id))
      .returning();
    res.status(201).json(serializeSession(updated[0]!));
    return;
  }

  const inserted = await db
    .insert(sessionsTable)
    .values({
      profileId: profile.id,
      chapterId,
      storyId: chapter[0]!.storyId,
    })
    .returning();
  res.status(201).json(serializeSession(inserted[0]!));
});

router.get("/sessions/active", async (req, res) => {
  const profile = await resolveProfile(req);
  const active = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), eq(sessionsTable.status, "active")))
    .orderBy(sql`${sessionsTable.startedAt} desc`)
    .limit(1);
  if (active.length > 0) {
    res.json(serializeSession(active[0]!));
    return;
  }
  const paused = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.profileId, profile.id), eq(sessionsTable.status, "paused")))
    .orderBy(sql`${sessionsTable.startedAt} desc`)
    .limit(1);
  if (paused.length === 0) {
    res.json(null);
    return;
  }
  res.json(serializeSession(paused[0]!));
});

router.post("/sessions/:sessionId/heartbeat", async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const parsed = HeartbeatSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid heartbeat body" });
    return;
  }
  const delta = Math.max(0, Math.min(HEARTBEAT_MAX_DELTA, parsed.data.activeMsDelta));
  const profile = await resolveProfile(req);
  const existing = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
  if (existing.length === 0 || existing[0]!.profileId !== profile.id) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (existing[0]!.status === "finished") {
    res.json(serializeSession(existing[0]!));
    return;
  }
  const updated = await db
    .update(sessionsTable)
    .set({ activeMs: existing[0]!.activeMs + delta, status: "active" })
    .where(eq(sessionsTable.id, sessionId))
    .returning();
  res.json(serializeSession(updated[0]!));
});

router.post("/sessions/:sessionId/pause", async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const profile = await resolveProfile(req);
  const existing = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
  if (existing.length === 0 || existing[0]!.profileId !== profile.id) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (existing[0]!.status === "finished") {
    res.json(serializeSession(existing[0]!));
    return;
  }
  const updated = await db
    .update(sessionsTable)
    .set({ status: "paused" })
    .where(eq(sessionsTable.id, sessionId))
    .returning();
  res.json(serializeSession(updated[0]!));
});

export function rewardForChapter(sortIndex: number) {
  return {
    gemsAwarded: 5 + sortIndex,
    starsAwarded: 1,
    xpAwarded: 10,
  };
}

router.post("/sessions/:sessionId/finish", async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const profileForFinish = await resolveProfile(req);
  const existing = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
  if (existing.length === 0 || existing[0]!.profileId !== profileForFinish.id) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const session = existing[0]!;
  const chapter = await db.select().from(chaptersTable).where(eq(chaptersTable.id, session.chapterId)).limit(1);
  const sortIndex = chapter[0]?.sortIndex ?? 0;
  const reward = rewardForChapter(sortIndex);
  const profileBefore = await reloadProfile(session.profileId);

  const wasFinished = session.status === "finished";

  // mark finished if not already
  let updatedSession = session;
  if (!wasFinished) {
    const u = await db
      .update(sessionsTable)
      .set({ status: "finished", endedAt: new Date() })
      .where(eq(sessionsTable.id, sessionId))
      .returning();
    updatedSession = u[0]!;
  }

  // Already-finished chapter? No double rewards.
  const already = await db
    .select()
    .from(finishedChaptersTable)
    .where(
      and(
        eq(finishedChaptersTable.profileId, session.profileId),
        eq(finishedChaptersTable.chapterId, session.chapterId),
      ),
    )
    .limit(1);

  let petLeveledUp = false;
  let newPetLevel: number | null = null;

  if (already.length === 0) {
    await db.insert(finishedChaptersTable).values({
      profileId: session.profileId,
      chapterId: session.chapterId,
    });

    let newXp = profileBefore.petXp + reward.xpAwarded;
    let newLevel = profileBefore.petLevel;
    while (newXp >= xpForNextLevel(newLevel)) {
      newXp -= xpForNextLevel(newLevel);
      newLevel += 1;
      petLeveledUp = true;
    }
    newPetLevel = petLeveledUp ? newLevel : null;
    const newHappiness = Math.min(100, profileBefore.happiness + 5);

    await db
      .update(childProfilesTable)
      .set({
        gems: profileBefore.gems + reward.gemsAwarded,
        stars: profileBefore.stars + reward.starsAwarded,
        petXp: newXp,
        petLevel: newLevel,
        happiness: newHappiness,
      })
      .where(eq(childProfilesTable.id, session.profileId));

    await db.insert(transactionsTable).values({
      profileId: session.profileId,
      kind: "earn",
      amountGems: reward.gemsAwarded,
      amountStars: reward.starsAwarded,
      reason: `Finished chapter ${session.chapterId}`,
    });
  }

  const profileAfter = await reloadProfile(session.profileId);
  const profilePayload = {
    id: profileAfter.id,
    name: profileAfter.name,
    gems: profileAfter.gems,
    stars: profileAfter.stars,
    petLevel: profileAfter.petLevel,
    petXp: profileAfter.petXp,
    petXpForNextLevel: xpForNextLevel(profileAfter.petLevel),
    petXpProgressPercent: xpProgressPercent(profileAfter.petXp, profileAfter.petLevel),
  };

  res.json({
    session: serializeSession(updatedSession),
    gemsAwarded: already.length === 0 ? reward.gemsAwarded : 0,
    starsAwarded: already.length === 0 ? reward.starsAwarded : 0,
    xpAwarded: already.length === 0 ? reward.xpAwarded : 0,
    petLeveledUp,
    newPetLevel,
    profile: profilePayload,
  });
});

router.post("/sessions/:sessionId/word-help", async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const parsed = LogWordHelpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const profileForWord = await resolveProfile(req);
  const session = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
  if (session.length === 0 || session[0]!.profileId !== profileForWord.id) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const chapter = await db.select().from(chaptersTable).where(eq(chaptersTable.id, session[0]!.chapterId)).limit(1);
  if (chapter.length === 0) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const word = chapter[0]!.tappableWords.find((w) => w.key === parsed.data.wordKey);
  if (!word) {
    res.status(404).json({ error: "Word not found in this chapter" });
    return;
  }
  await db.insert(wordHelpEventsTable).values({
    profileId: session[0]!.profileId,
    sessionId,
    chapterId: session[0]!.chapterId,
    wordKey: word.key,
    word: word.word,
  });
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wordHelpEventsTable)
    .where(
      and(
        eq(wordHelpEventsTable.profileId, session[0]!.profileId),
        eq(wordHelpEventsTable.wordKey, word.key),
      ),
    );
  res.json({
    word,
    helpCount: countResult[0]?.count ?? 0,
  });
});

export default router;
