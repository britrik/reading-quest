import { Router, type IRouter } from "express";
import {
  db,
  childProfilesTable,
  sessionsTable,
  wordHelpEventsTable,
  finishedChaptersTable,
  ownedItemsTable,
  decorStateTable,
  transactionsTable,
  preferencesTable,
} from "@workspace/db";
import { ne, sql } from "drizzle-orm";
import { getOrCreateActiveProfile, DEFAULT_PROFILE_NAME } from "../lib/profile";

const router: IRouter = Router();

// Destructive endpoint — only mounted (and only responds) when ALL of:
//   - NODE_ENV is not "production"
//   - ENABLE_E2E_TEST_ROUTES is explicitly set to "true"
//   - E2E_TEST_SECRET env var is set (no default, never enabled silently)
// Callers must present the same secret in `x-e2e-test-secret` to invoke it.
const TEST_SECRET = process.env["E2E_TEST_SECRET"];

router.post("/test/reset", async (req, res) => {
  if (
    process.env["NODE_ENV"] === "production" ||
    process.env["ENABLE_E2E_TEST_ROUTES"] !== "true" ||
    !TEST_SECRET
  ) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (req.header("x-e2e-test-secret") !== TEST_SECRET) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  // Fully wipe per-profile data tables.
  await db.delete(wordHelpEventsTable);
  await db.delete(sessionsTable);
  await db.delete(finishedChaptersTable);
  await db.delete(transactionsTable);
  await db.delete(decorStateTable);
  await db.delete(ownedItemsTable);
  await db.delete(preferencesTable);

  // Drop every profile except the lowest-id one (the canonical "Alex"), so
  // tests start each run with a single, clean profile and id is stable.
  const remaining = await db.select({ id: childProfilesTable.id }).from(childProfilesTable);
  if (remaining.length > 0) {
    const minId = remaining.reduce((m, r) => (r.id < m ? r.id : m), remaining[0]!.id);
    await db.delete(childProfilesTable).where(ne(childProfilesTable.id, minId));
    await db
      .update(childProfilesTable)
      .set({
        name: DEFAULT_PROFILE_NAME,
        avatar: "fox",
        gems: 0,
        stars: 0,
        petLevel: 1,
        petXp: 0,
        fullness: 70,
        happiness: 70,
        equippedHat: null,
        glowColor: "mint",
        companion: sql`null`,
        onboardedAt: sql`null`,
      });
  }

  const profile = await getOrCreateActiveProfile();
  res.json({ ok: true, profileId: profile.id });
});

export default router;
