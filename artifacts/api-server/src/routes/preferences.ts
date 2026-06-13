import { Router, type IRouter } from "express";
import { db, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { resolveProfile } from "../lib/profile";
import { isGrownupAuthorized } from "../lib/grownup-auth";

const router: IRouter = Router();

const FONT_SIZES = ["small", "medium", "large"] as const;
const SOUNDSCAPES = ["none", "forest", "rain", "ocean"] as const;
const LANGUAGE_VARIANTS = ["en-GB", "en-US"] as const;
const LIVELINESS_LEVELS = ["quiet", "cozy", "lively"] as const;

// Kid-safe fields the kid app may modify without grown-ups auth. voiceSpeed
// lives here because it is a kid-comfort setting (read-aloud speed) that the
// kid Cozy Settings UI exposes directly.
const KidPreferencesBody = z.object({
  fontSize: z.enum(FONT_SIZES).optional(),
  highContrast: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  voiceSpeed: z.number().min(0.5).max(1.5).optional(),
  soundscape: z.enum(SOUNDSCAPES).optional(),
  soundEnabled: z.boolean().optional(),
  liveliness: z.enum(LIVELINESS_LEVELS).optional(),
});

// Grown-up-only fields. Writes require the grown-ups token (parental control
// fields) and so do reads of the personally-identifying ones (weeklyEmail*).
// We strip the email fields from kid-side GETs so a kid cannot peek at the
// email address. languageVariant is grown-up-writable but kid-readable so the
// kid app can render British/American copy without a separate lookup.
const GrownupPreferencesBody = z.object({
  sessionLengthSuggestionMin: z.number().int().min(5).max(60).optional(),
  breakReminders: z.boolean().optional(),
  weeklyEmailOptIn: z.boolean().optional(),
  weeklyEmailAddress: z.union([z.string().email(), z.literal("")]).optional(),
  languageVariant: z.enum(LANGUAGE_VARIANTS).optional(),
});

const PreferencesBody = KidPreferencesBody.merge(GrownupPreferencesBody);
const GROWNUP_FIELDS = new Set(Object.keys(GrownupPreferencesBody.shape));

function serialize(row: typeof preferencesTable.$inferSelect, includeGrownup: boolean) {
  const base = {
    fontSize: row.fontSize,
    highContrast: row.highContrast,
    reducedMotion: row.reducedMotion,
    voiceSpeed: Math.round(row.voiceSpeed) / 10,
    soundscape: row.soundscape,
    soundEnabled: row.soundEnabled,
    languageVariant: row.languageVariant,
    liveliness: row.liveliness,
  };
  if (!includeGrownup) return base;
  return {
    ...base,
    sessionLengthSuggestionMin: row.sessionLengthSuggestionMin,
    breakReminders: row.breakReminders,
    weeklyEmailOptIn: row.weeklyEmailOptIn,
    weeklyEmailAddress: row.weeklyEmailAddress,
  };
}

async function getOrCreate(profileId: number) {
  const rows = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.profileId, profileId))
    .limit(1);
  if (rows.length > 0) return rows[0]!;
  const inserted = await db
    .insert(preferencesTable)
    .values({ profileId })
    .onConflictDoNothing()
    .returning();
  if (inserted.length > 0) return inserted[0]!;
  const reread = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.profileId, profileId))
    .limit(1);
  return reread[0]!;
}

router.get("/preferences", async (req, res) => {
  const profile = await resolveProfile(req);
  const row = await getOrCreate(profile.id);
  res.json(serialize(row, isGrownupAuthorized(req)));
});

router.put("/preferences", async (req, res) => {
  const parsed = PreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  // Grown-up-only fields require the grown-ups token. We fail closed so a kid
  // cannot disable break reminders or change the weekly-email recipient.
  const touchesGrownup = Object.keys(parsed.data).some((k) => GROWNUP_FIELDS.has(k));
  if (touchesGrownup && !isGrownupAuthorized(req)) {
    res.status(401).json({ error: "Grown-ups passcode required for these settings" });
    return;
  }

  const profile = await resolveProfile(req);
  await getOrCreate(profile.id);

  const patch: Record<string, unknown> = {};
  if (parsed.data.fontSize !== undefined) patch.fontSize = parsed.data.fontSize;
  if (parsed.data.highContrast !== undefined) patch.highContrast = parsed.data.highContrast;
  if (parsed.data.reducedMotion !== undefined) patch.reducedMotion = parsed.data.reducedMotion;
  if (parsed.data.voiceSpeed !== undefined) patch.voiceSpeed = Math.round(parsed.data.voiceSpeed * 10);
  if (parsed.data.soundscape !== undefined) patch.soundscape = parsed.data.soundscape;
  if (parsed.data.soundEnabled !== undefined) patch.soundEnabled = parsed.data.soundEnabled;
  if (parsed.data.liveliness !== undefined) patch.liveliness = parsed.data.liveliness;
  if (parsed.data.sessionLengthSuggestionMin !== undefined)
    patch.sessionLengthSuggestionMin = parsed.data.sessionLengthSuggestionMin;
  if (parsed.data.breakReminders !== undefined) patch.breakReminders = parsed.data.breakReminders;
  if (parsed.data.weeklyEmailOptIn !== undefined) patch.weeklyEmailOptIn = parsed.data.weeklyEmailOptIn;
  if (parsed.data.weeklyEmailAddress !== undefined) {
    patch.weeklyEmailAddress = parsed.data.weeklyEmailAddress === "" ? null : parsed.data.weeklyEmailAddress;
  }
  if (parsed.data.languageVariant !== undefined) patch.languageVariant = parsed.data.languageVariant;

  if (Object.keys(patch).length > 0) {
    await db.update(preferencesTable).set(patch).where(eq(preferencesTable.profileId, profile.id));
  }
  const updated = await getOrCreate(profile.id);
  res.json(serialize(updated, isGrownupAuthorized(req)));
});

export default router;
