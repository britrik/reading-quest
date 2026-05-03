import { Router, type IRouter } from "express";
import {
  db,
  worldsTable,
  storiesTable,
  chaptersTable,
  finishedChaptersTable,
  unlockedStoriesTable,
  childProfilesTable,
  transactionsTable,
} from "@workspace/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { resolveProfile } from "../lib/profile";

const router: IRouter = Router();

async function unlockedStoryIdsFor(profileId: number, storyIds: number[]): Promise<Set<number>> {
  if (storyIds.length === 0) return new Set();
  const rows = await db
    .select()
    .from(unlockedStoriesTable)
    .where(and(eq(unlockedStoriesTable.profileId, profileId), inArray(unlockedStoriesTable.storyId, storyIds)));
  return new Set(rows.map((r) => r.storyId));
}

router.get("/worlds", async (_req, res) => {
  const rows = await db.select().from(worldsTable).orderBy(asc(worldsTable.sortIndex));
  res.json(rows);
});

router.get("/worlds/:worldId/stories", async (req, res) => {
  const worldId = Number(req.params.worldId);
  if (!Number.isInteger(worldId)) {
    res.status(400).json({ error: "Invalid worldId" });
    return;
  }
  const world = await db.select().from(worldsTable).where(eq(worldsTable.id, worldId)).limit(1);
  if (world.length === 0) {
    res.status(404).json({ error: "World not found" });
    return;
  }
  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.worldId, worldId))
    .orderBy(asc(storiesTable.sortIndex));

  const profile = await resolveProfile(req);
  const storyIds = stories.map((s) => s.id);
  const chapters = storyIds.length
    ? await db.select().from(chaptersTable).where(inArray(chaptersTable.storyId, storyIds))
    : [];
  const chapterIds = chapters.map((c) => c.id);
  const finished = chapterIds.length
    ? await db
        .select()
        .from(finishedChaptersTable)
        .where(inArray(finishedChaptersTable.chapterId, chapterIds))
    : [];
  const finishedSet = new Set(finished.filter((f) => f.profileId === profile.id).map((f) => f.chapterId));

  const unlocks = await unlockedStoryIdsFor(profile.id, storyIds);
  const result = stories.map((s) => {
    const myChapters = chapters.filter((c) => c.storyId === s.id);
    const finishedCount = myChapters.filter((c) => finishedSet.has(c.id)).length;
    const unlocked = s.gemUnlockCost === 0 || unlocks.has(s.id);
    return {
      id: s.id,
      worldId: s.worldId,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      chapterCount: myChapters.length,
      finishedChapterCount: finishedCount,
      gemUnlockCost: s.gemUnlockCost,
      unlocked,
    };
  });

  res.json(result);
});

router.post("/stories/:storyId/unlock", async (req, res) => {
  const storyId = Number(req.params.storyId);
  if (!Number.isInteger(storyId)) {
    res.status(400).json({ error: "Invalid storyId" });
    return;
  }
  const profile = await resolveProfile(req);
  const story = await db.select().from(storiesTable).where(eq(storiesTable.id, storyId)).limit(1);
  if (story.length === 0) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  const s = story[0]!;
  if (s.gemUnlockCost === 0) {
    res.json({ ok: true, alreadyUnlocked: true, gemsRemaining: profile.gems });
    return;
  }
  const already = await db
    .select()
    .from(unlockedStoriesTable)
    .where(and(eq(unlockedStoriesTable.profileId, profile.id), eq(unlockedStoriesTable.storyId, storyId)))
    .limit(1);
  if (already.length > 0) {
    res.json({ ok: true, alreadyUnlocked: true, gemsRemaining: profile.gems });
    return;
  }
  if (profile.gems < s.gemUnlockCost) {
    res.status(400).json({ error: "Not enough gems", gemsRemaining: profile.gems, gemUnlockCost: s.gemUnlockCost });
    return;
  }
  const newGems = profile.gems - s.gemUnlockCost;
  await db.update(childProfilesTable).set({ gems: newGems }).where(eq(childProfilesTable.id, profile.id));
  await db.insert(unlockedStoriesTable).values({ profileId: profile.id, storyId });
  await db.insert(transactionsTable).values({
    profileId: profile.id,
    kind: "spend",
    amountGems: -s.gemUnlockCost,
    reason: `unlock_story:${s.slug}`,
  });
  res.json({ ok: true, alreadyUnlocked: false, gemsRemaining: newGems });
});

router.get("/stories/:storyId", async (req, res) => {
  const storyId = Number(req.params.storyId);
  if (!Number.isInteger(storyId)) {
    res.status(400).json({ error: "Invalid storyId" });
    return;
  }
  const story = await db.select().from(storiesTable).where(eq(storiesTable.id, storyId)).limit(1);
  if (story.length === 0) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.storyId, storyId))
    .orderBy(asc(chaptersTable.sortIndex));
  const profile = await resolveProfile(req);
  const finished = chapters.length
    ? await db
        .select()
        .from(finishedChaptersTable)
        .where(inArray(
          finishedChaptersTable.chapterId,
          chapters.map((c) => c.id),
        ))
    : [];
  const finishedSet = new Set(finished.filter((f) => f.profileId === profile.id).map((f) => f.chapterId));
  res.json({
    id: story[0]!.id,
    worldId: story[0]!.worldId,
    title: story[0]!.title,
    summary: story[0]!.summary,
    chapters: chapters.map((c) => ({
      id: c.id,
      storyId: c.storyId,
      sortIndex: c.sortIndex,
      title: c.title,
      finished: finishedSet.has(c.id),
    })),
  });
});

router.get("/chapters/:chapterId", async (req, res) => {
  const chapterId = Number(req.params.chapterId);
  if (!Number.isInteger(chapterId)) {
    res.status(400).json({ error: "Invalid chapterId" });
    return;
  }
  const rows = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const c = rows[0]!;
  const sibs = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.storyId, c.storyId))
    .orderBy(asc(chaptersTable.sortIndex));
  const idx = sibs.findIndex((s) => s.id === c.id);
  const next = idx >= 0 && idx + 1 < sibs.length ? sibs[idx + 1]! : null;
  res.json({
    id: c.id,
    storyId: c.storyId,
    sortIndex: c.sortIndex,
    title: c.title,
    sceneImageUrl: c.sceneImageUrl,
    chapterCount: sibs.length,
    nextChapterId: next ? next.id : null,
    paragraphs: c.paragraphs,
    tappableWords: c.tappableWords,
  });
});

export default router;
