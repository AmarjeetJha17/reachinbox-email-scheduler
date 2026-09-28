import { Router } from "express";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    getScheduledEmails,
    getSentEmails
} from "../controllers/email.controller.js";

const router = Router();

router.get(
    "/scheduled",
    requireAuth,
    getScheduledEmails
);

router.get(
    "/sent",
    requireAuth,
    getSentEmails
);

export default router;