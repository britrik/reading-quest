import { Router, type IRouter } from "express";
import { db, childProfilesTable, preferencesTable, sessionsTable, wordHelpEventsTable, finishedChaptersTable, transactionsTable, ownedItemsTable, decorStateTable, unlockedStoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isGrownupAuthorized, requireGrownup } from "../lib/grownup-auth";

const router: IRouter = Router();

const AVATARS = ["fox", "owl", "bunny", "turtle", "star", "moon"] as const;
const COMPANIONS = ["fox", "owl", "bunny"] as const;

const CreateProfileBody = z.object({
  name: z.string().trim().min(1).max(40),
  avatar: z.enum(AVATARS).optional(),
});
const UpdateProfileBody = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  avatar: z.enum(AVATARS).optional(),
  companion: z.union([z.enum(COMPANIONS), z.null()]).optional(),
  onboardedAt: z.union([z.string().datetime(), z.null()]).optional(),
});

router.get("/profiles", async (_req, res) => {
  const rows = await db.select().from(childProfilesTable).orderBy(childProfilesTable.id);
  res.json(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      companion: p.companion,
      gems: p.gems,
      stars: p.stars,
      onboarded: p.onboardedAt !== null,
    })),
  );
});

router.post("/profiles", async (req, res) => {
  if (!requireGrownup(req, res)) return;
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const inserted = await db
    .insert(childProfilesTable)
    .values({ name: parsed.data.name, avatar: parsed.data.avatar ?? "fox" })
    .returning();
  const p = inserted[0]!;
  await db.insert(preferencesTable).values({ profileId: p.id }).onConflictDoNothing();
  res.status(201).json({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    companion: p.companion,
    gems: p.gems,
    stars: p.stars,
    onboarded: false,
  });
});

router.patch("/profiles/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  // Identity (name/avatar) is grown-ups-only EXCEPT during the kid's first-time
  // onboarding completion. To make sure this carve-out cannot be abused as a
  // generic rename channel, we load the existing profile first and require:
  //   1. the current row has not been onboarded yet (onboardedAt IS NULL), AND
  //   2. this PATCH is the one that sets onboardedAt (settingOnboardedNow).
  // Any later rename, or any attempt to set name without setting onboardedAt,
  // falls through to the grown-ups token check.
  const existingRows = await db
    .select()
    .from(childProfilesTable)
    .where(eq(childProfilesTable.id, id))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const touchesIdentity =
    parsed.data.name !== undefined || parsed.data.avatar !== undefined;
  const settingOnboardedNow =
    parsed.data.onboardedAt !== undefined && parsed.data.onboardedAt !== null;
  const isOnboardingCompletion = existing.onboardedAt === null && settingOnboardedNow;
  if (touchesIdentity && !isGrownupAuthorized(req) && !isOnboardingCompletion) {
    res.status(401).json({ error: "Grown-ups passcode required" });
    return;
  }
  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.avatar !== undefined) patch.avatar = parsed.data.avatar;
  if (parsed.data.companion !== undefined) patch.companion = parsed.data.companion;
  if (parsed.data.onboardedAt !== undefined) {
    patch.onboardedAt = parsed.data.onboardedAt === null ? null : new Date(parsed.data.onboardedAt);
  }
  const updated = await db
    .update(childProfilesTable)
    .set(patch)
    .where(eq(childProfilesTable.id, id))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const p = updated[0]!;
  res.json({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    companion: p.companion,
    gems: p.gems,
    stars: p.stars,
    onboarded: p.onboardedAt !== null,
  });
});

router.delete("/profiles/:id", async (req, res) => {
  if (!requireGrownup(req, res)) return;
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const all = await db.select({ id: childProfilesTable.id }).from(childProfilesTable);
  if (all.length <= 1) {
    res.status(400).json({ error: "Cannot delete the last profile" });
    return;
  }
  await db.delete(wordHelpEventsTable).where(eq(wordHelpEventsTable.profileId, id));
  await db.delete(sessionsTable).where(eq(sessionsTable.profileId, id));
  await db.delete(finishedChaptersTable).where(eq(finishedChaptersTable.profileId, id));
  await db.delete(transactionsTable).where(eq(transactionsTable.profileId, id));
  await db.delete(decorStateTable).where(eq(decorStateTable.profileId, id));
  await db.delete(ownedItemsTable).where(eq(ownedItemsTable.profileId, id));
  await db.delete(unlockedStoriesTable).where(eq(unlockedStoriesTable.profileId, id));
  await db.delete(preferencesTable).where(eq(preferencesTable.profileId, id));
  await db.delete(childProfilesTable).where(eq(childProfilesTable.id, id));
  res.json({ ok: true });
});

export default router;
