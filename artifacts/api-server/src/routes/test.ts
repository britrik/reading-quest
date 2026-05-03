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
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { getOrCreateActiveProfile } from "../lib/profile";

const router: IRouter = Router();

// Destructive endpoint — only mounted (and only responds) when both:
//   - NODE_ENV is not "production"
//   - ENABLE_E2E_TEST_ROUTES is explicitly set to "true"
// Callers must additionally present the shared secret in `x-e2e-test-secret`
// (defaults to "reading-quest-e2e" for local dev).
const TEST_SECRET = process.env["E2E_TEST_SECRET"] || "reading-quest-e2e";

router.post("/test/reset", async (req, res) => {
  if (
    process.env["NODE_ENV"] === "production" ||
    process.env["ENABLE_E2E_TEST_ROUTES"] !== "true"
  ) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (req.header("x-e2e-test-secret") !== TEST_SECRET) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const profile = await getOrCreateActiveProfile();
  await db.delete(wordHelpEventsTable).where(eq(wordHelpEventsTable.profileId, profile.id));
  await db.delete(sessionsTable).where(eq(sessionsTable.profileId, profile.id));
  await db.delete(finishedChaptersTable).where(eq(finishedChaptersTable.profileId, profile.id));
  await db.delete(transactionsTable).where(eq(transactionsTable.profileId, profile.id));
  await db.delete(decorStateTable).where(eq(decorStateTable.profileId, profile.id));
  await db.delete(ownedItemsTable).where(eq(ownedItemsTable.profileId, profile.id));
  await db
    .update(childProfilesTable)
    .set({
      gems: 0,
      stars: 0,
      petLevel: 1,
      petXp: 0,
      fullness: 70,
      happiness: 70,
      equippedHat: null,
      glowColor: "mint",
    })
    .where(eq(childProfilesTable.id, profile.id));

  res.json({ ok: true, profileId: profile.id });
});

export default router;
