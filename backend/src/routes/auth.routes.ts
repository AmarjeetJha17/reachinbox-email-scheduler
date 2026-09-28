import { Router } from "express";

import {
    startGoogleAuth,
    googleCallback,
    getCurrentUser,
    logout
} from "../controllers/auth.controller.js";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
    "/google",
    startGoogleAuth
);

router.get(
    "/google/callback",
    googleCallback
);

router.get(
    "/me",
    requireAuth,
    getCurrentUser
);

router.post(
    "/logout",
    logout
);

export default router;