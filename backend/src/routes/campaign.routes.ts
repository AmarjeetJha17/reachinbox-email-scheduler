import { Router } from "express";

import {
    scheduleCampaignController
} from "../controllers/campaign.controller.js";

const router = Router();

router.post(
    "/schedule",
    scheduleCampaignController
);

export default router;