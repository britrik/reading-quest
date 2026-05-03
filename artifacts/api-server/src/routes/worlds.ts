import { Router, type IRouter } from "express";
import { db, worldsTable, storiesTable, chaptersTable, finishedChaptersTable } from "@workspace/db";
import { asc, eq, inArray } from "drizzle-orm";
import { resolveProfile } from "../lib/profile";

const router: IRouter = Router();

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

  const result = stories.map((s) => {
    const myChapters = chapters.filter((c) => c.storyId === s.id);
    const finishedCount = myChapters.filter((c) => finishedSet.has(c.id)).length;
    return {
      id: s.id,
      worldId: s.worldId,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      chapterCount: myChapters.length,
      finishedChapterCount: finishedCount,
    };
  });

  res.json(result);
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
