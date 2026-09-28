import { Router } from "express";
import {
  getSenders,
  createSenderController
} from "../controllers/sender.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getSenders);
router.post("/", requireAuth, createSenderController);

export default router;