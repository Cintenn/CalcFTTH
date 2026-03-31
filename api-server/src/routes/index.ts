import 'dotenv/config';

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import calculationsRouter from "./calculations.js";
import projectsRouter from "./projects.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/calculations", calculationsRouter);
router.use("/projects", projectsRouter);
router.use("/users", usersRouter);

export default router;
