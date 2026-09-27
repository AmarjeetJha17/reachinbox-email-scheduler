import { Router } from "express";
import { createTestJob } from "../controllers/test-job.controller.js";

const router = Router();

router.post("/", createTestJob);

export default router;