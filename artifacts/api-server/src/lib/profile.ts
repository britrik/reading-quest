import { db, childProfilesTable, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { getAuthenticatedProfileId } from "./kid-session";
import { isGrownupAuthorized } from "./grownup-auth";

export const DEFAULT_PROFILE_NAME = "Alex";

export function xpForNextLevel(level: number): number {
  return level * 50;
}

export function xpProgressPercent(xp: number, level: number): number {
  const need = xpForNextLevel(level);
  if (need <= 0) return 0;
  const pct = Math.floor((xp / need) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function moodFromHappiness(h: number): "ecstatic" | "happy" | "okay" | "lonely" {
  if (h >= 85) return "ecstatic";
  if (h >= 60) return "happy";
  if (h >= 30) return "okay";
  return "lonely";
}

async function ensurePreferences(profileId: number): Promise<void> {
  const existing = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.profileId, profileId))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(preferencesTable).values({ profileId }).onConflictDoNothing();
  }
}

export async function getOrCreateActiveProfile() {
  const existing = await db.select().from(childProfilesTable).orderBy(childProfilesTable.id).limit(1);
  if (existing.length > 0) {
    await ensurePreferences(existing[0]!.id);
    return existing[0]!;
  }
  const inserted = await db
    .insert(childProfilesTable)
    .values({ name: DEFAULT_PROFILE_NAME })
    .returning();
  await ensurePreferences(inserted[0]!.id);
  return inserted[0]!;
}

/**
 * Resolve the profile for the current request.
 *
 * Priority:
 *  1. Grown-up auth allows specifying any profile via `x-profile-id` header
 *     (grown-ups need cross-profile access for the dashboard).
 *  2. Signed session cookie — the profile ID is extracted from the cookie and
 *     the header is ignored, preventing impersonation.
 *  3. No auth yet (onboarding flow) — create/get the first profile.
 */
export async function resolveProfile(req: Request) {
  // Priority 1: Grown-up auth allows specifying any profile via header
  if (isGrownupAuthorized(req)) {
    const headerVal = req.header("x-profile-id");
    if (headerVal) {
      const id = Number.parseInt(headerVal, 10);
      if (Number.isFinite(id) && id > 0) {
        const rows = await db
          .select()
          .from(childProfilesTable)
          .where(eq(childProfilesTable.id, id))
          .limit(1);
        if (rows.length > 0) {
          await ensurePreferences(id);
          return rows[0]!;
        }
      }
    }
  }

  // Priority 2: Signed session cookie
  const sessionProfileId = getAuthenticatedProfileId(req);
  if (sessionProfileId !== null) {
    const rows = await db
      .select()
      .from(childProfilesTable)
      .where(eq(childProfilesTable.id, sessionProfileId))
      .limit(1);
    if (rows.length > 0) {
      await ensurePreferences(sessionProfileId);
      return rows[0]!;
    }
  }

  // Priority 3: No auth yet (onboarding) — create/get active profile
  return getOrCreateActiveProfile();
}

export async function reloadProfile(id: number) {
  const rows = await db
    .select()
    .from(childProfilesTable)
    .where(eq(childProfilesTable.id, id))
    .limit(1);
  return rows[0]!;
}
