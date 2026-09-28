import { Router } from "express";

import {
    scheduleCampaignController
} from "../controllers/campaign.controller.js";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/schedule",
    requireAuth,
    scheduleCampaignController
);

export default router;