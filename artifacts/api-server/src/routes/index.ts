import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import worldsRouter from "./worlds";
import sessionsRouter from "./sessions";
import petRouter from "./pet";
import grownupsRouter from "./grownups";
import profilesRouter from "./profiles";
import preferencesRouter from "./preferences";
import insightsRouter from "./insights";
import testRouter from "./test";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(worldsRouter);
router.use(sessionsRouter);
router.use(petRouter);
router.use(grownupsRouter);
router.use(profilesRouter);
router.use(preferencesRouter);
router.use(insightsRouter);
if (
  process.env["NODE_ENV"] !== "production" &&
  process.env["ENABLE_E2E_TEST_ROUTES"] === "true"
) {
  router.use(testRouter);
}

export default router;
