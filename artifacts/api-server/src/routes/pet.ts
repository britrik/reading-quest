import { Router, type IRouter } from "express";
import {
  db,
  childProfilesTable,
  shopItemsTable,
  ownedItemsTable,
  decorStateTable,
  transactionsTable,
} from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  FeedPetBody,
  EquipPetItemBody,
  TogglePetDecorBody,
  PurchaseShopItemBody,
} from "@workspace/api-zod";
import {
  reloadProfile,
  resolveProfile,
  xpForNextLevel,
  xpProgressPercent,
  moodFromHappiness,
} from "../lib/profile";

const router: IRouter = Router();

async function petStatePayload(profileId: number) {
  const p = await reloadProfile(profileId);
  const decor = await db
    .select()
    .from(decorStateTable)
    .where(and(eq(decorStateTable.profileId, profileId), eq(decorStateTable.enabled, true)));
  return {
    profileId: p.id,
    level: p.petLevel,
    xp: p.petXp,
    xpForNextLevel: xpForNextLevel(p.petLevel),
    xpProgressPercent: xpProgressPercent(p.petXp, p.petLevel),
    fullness: p.fullness,
    happiness: p.happiness,
    mood: moodFromHappiness(p.happiness),
    equippedHat: p.equippedHat,
    glowColor: p.glowColor,
    decor: decor.map((d) => d.itemId),
    gems: p.gems,
    stars: p.stars,
  };
}

router.get("/pet", async (req, res) => {
  const profile = await resolveProfile(req);
  res.json(await petStatePayload(profile.id));
});

router.post("/pet/feed", async (req, res) => {
  const parsed = FeedPetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const profile = await resolveProfile(req);
  const item = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, parsed.data.itemId)).limit(1);
  if (item.length === 0 || item[0]!.kind !== "snack") {
    res.status(400).json({ error: "Snack not available" });
    return;
  }
  if (profile.gems < item[0]!.gemPrice) {
    res.status(400).json({ error: "Not enough gems" });
    return;
  }
  await db
    .update(childProfilesTable)
    .set({
      gems: profile.gems - item[0]!.gemPrice,
      fullness: Math.min(100, profile.fullness + item[0]!.fullnessBoost),
      happiness: Math.min(100, profile.happiness + item[0]!.happinessBoost),
    })
    .where(eq(childProfilesTable.id, profile.id));
  await db.insert(transactionsTable).values({
    profileId: profile.id,
    kind: "spend",
    amountGems: item[0]!.gemPrice,
    reason: `Fed pet: ${item[0]!.name}`,
  });
  res.json(await petStatePayload(profile.id));
});

router.post("/pet/equip", async (req, res) => {
  const parsed = EquipPetItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { slot, itemId } = parsed.data;
  if (slot !== "hat" && slot !== "glow") {
    res.status(400).json({ error: "Invalid slot" });
    return;
  }
  const profile = await resolveProfile(req);
  if (itemId) {
    const owned = await db
      .select()
      .from(ownedItemsTable)
      .where(and(eq(ownedItemsTable.profileId, profile.id), eq(ownedItemsTable.itemId, itemId)));
    if (owned.length === 0) {
      res.status(400).json({ error: "Item not owned" });
      return;
    }
    const item = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, itemId)).limit(1);
    if (item.length === 0 || item[0]!.kind !== slot) {
      res.status(400).json({ error: `Item is not a ${slot}` });
      return;
    }
  }
  if (slot === "hat") {
    await db.update(childProfilesTable).set({ equippedHat: itemId ?? null }).where(eq(childProfilesTable.id, profile.id));
  } else {
    await db.update(childProfilesTable).set({ glowColor: itemId ?? "mint" }).where(eq(childProfilesTable.id, profile.id));
  }
  res.json(await petStatePayload(profile.id));
});

router.post("/pet/decor", async (req, res) => {
  const parsed = TogglePetDecorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { itemId, on } = parsed.data;
  const profile = await resolveProfile(req);
  const owned = await db
    .select()
    .from(ownedItemsTable)
    .where(and(eq(ownedItemsTable.profileId, profile.id), eq(ownedItemsTable.itemId, itemId)));
  if (owned.length === 0) {
    res.status(400).json({ error: "Decor not owned" });
    return;
  }
  const existing = await db
    .select()
    .from(decorStateTable)
    .where(and(eq(decorStateTable.profileId, profile.id), eq(decorStateTable.itemId, itemId)));
  if (existing.length === 0) {
    await db.insert(decorStateTable).values({ profileId: profile.id, itemId, enabled: on });
  } else {
    await db
      .update(decorStateTable)
      .set({ enabled: on })
      .where(and(eq(decorStateTable.profileId, profile.id), eq(decorStateTable.itemId, itemId)));
  }
  res.json(await petStatePayload(profile.id));
});

router.get("/shop", async (req, res) => {
  const profile = await resolveProfile(req);
  const items = await db.select().from(shopItemsTable).orderBy(asc(shopItemsTable.sortIndex));
  const owned = await db.select().from(ownedItemsTable).where(eq(ownedItemsTable.profileId, profile.id));
  const ownedSet = new Set(owned.map((o) => o.itemId));
  res.json(
    items.map((it) => {
      const locked = it.requiresPetLevel > profile.petLevel;
      return {
        id: it.id,
        kind: it.kind,
        name: it.name,
        description: it.description,
        gemPrice: it.gemPrice,
        fullnessBoost: it.fullnessBoost,
        happinessBoost: it.happinessBoost,
        requiresPetLevel: it.requiresPetLevel,
        owned: ownedSet.has(it.id),
        locked,
        lockHint: locked ? `Reach Pet Level ${it.requiresPetLevel} to unlock` : null,
        emoji: it.emoji,
        glowColor: it.glowColor,
      };
    }),
  );
});

router.post("/shop/purchase", async (req, res) => {
  const parsed = PurchaseShopItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const profile = await resolveProfile(req);
  const item = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, parsed.data.itemId)).limit(1);
  if (item.length === 0) {
    res.status(400).json({ error: "Item not found" });
    return;
  }
  if (item[0]!.kind === "snack") {
    res.status(400).json({ error: "Snacks must be purchased via /pet/feed" });
    return;
  }
  if (item[0]!.requiresPetLevel > profile.petLevel) {
    res.status(400).json({ error: "Item is locked" });
    return;
  }
  const existing = await db
    .select()
    .from(ownedItemsTable)
    .where(and(eq(ownedItemsTable.profileId, profile.id), eq(ownedItemsTable.itemId, item[0]!.id)));
  if (existing.length > 0) {
    res.status(400).json({ error: "Already owned" });
    return;
  }
  if (profile.gems < item[0]!.gemPrice) {
    res.status(400).json({ error: "Not enough gems" });
    return;
  }
  await db
    .update(childProfilesTable)
    .set({ gems: profile.gems - item[0]!.gemPrice })
    .where(eq(childProfilesTable.id, profile.id));
  await db.insert(ownedItemsTable).values({ profileId: profile.id, itemId: item[0]!.id });
  await db.insert(transactionsTable).values({
    profileId: profile.id,
    kind: "spend",
    amountGems: item[0]!.gemPrice,
    reason: `Bought ${item[0]!.name}`,
  });
  res.json(await petStatePayload(profile.id));
});

export default router;
