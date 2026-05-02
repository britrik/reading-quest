import { Router, type IRouter } from "express";
import { getOrCreateActiveProfile, xpForNextLevel, xpProgressPercent } from "../lib/profile";

const router: IRouter = Router();

router.get("/me", async (_req, res) => {
  const p = await getOrCreateActiveProfile();
  res.json({
    id: p.id,
    name: p.name,
    gems: p.gems,
    stars: p.stars,
    petLevel: p.petLevel,
    petXp: p.petXp,
    petXpForNextLevel: xpForNextLevel(p.petLevel),
    petXpProgressPercent: xpProgressPercent(p.petXp, p.petLevel),
  });
});

export default router;
