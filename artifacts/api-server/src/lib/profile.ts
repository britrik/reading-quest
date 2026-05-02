import { db, childProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export async function getOrCreateActiveProfile() {
  const existing = await db.select().from(childProfilesTable).limit(1);
  if (existing.length > 0) return existing[0]!;
  const inserted = await db
    .insert(childProfilesTable)
    .values({ name: DEFAULT_PROFILE_NAME })
    .returning();
  return inserted[0]!;
}

export async function reloadProfile(id: number) {
  const rows = await db
    .select()
    .from(childProfilesTable)
    .where(eq(childProfilesTable.id, id))
    .limit(1);
  return rows[0]!;
}
