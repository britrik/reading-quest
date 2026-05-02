import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import worldsRouter from "./worlds";
import sessionsRouter from "./sessions";
import petRouter from "./pet";
import grownupsRouter from "./grownups";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(worldsRouter);
router.use(sessionsRouter);
router.use(petRouter);
router.use(grownupsRouter);

export default router;
