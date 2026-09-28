import crypto from "node:crypto";

import type {
    Request,
    Response
} from "express";

import {
    googleOAuthClient
} from "../config/google.js";

import {
    env
} from "../config/env.js";

import {
    findOrCreateGoogleUser
} from "../services/auth.service.js";

import {
    signAuthToken
} from "../utils/jwt.js";

import type {
    AuthenticatedRequest
} from "../middleware/auth.middleware.js";

const STATE_COOKIE =
    "reachinbox_oauth_state";

export function startGoogleAuth(
    _req: Request,
    res: Response
): void {
    const state =
        crypto.randomBytes(32).toString("hex");

    const authorizationUrl =
        googleOAuthClient.generateAuthUrl({
            access_type: "online",

            scope: [
                "openid",
                "email",
                "profile"
            ],

            state,

            prompt: "select_account"
        });

    res.cookie(
        STATE_COOKIE,
        state,
        {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
            path: "/"
        }
    );

    res.redirect(authorizationUrl);
}

export async function googleCallback(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const {
            code,
            state,
            error
        } = req.query;

        if (error) {
            res.redirect(
                `${env.WEB_ORIGIN}/login?error=google_denied`
            );

            return;
        }

        if (
            typeof code !== "string" ||
            typeof state !== "string"
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Missing OAuth callback parameters"
            });

            return;
        }

        const expectedState =
            req.cookies?.[STATE_COOKIE];

        if (
            !expectedState ||
            expectedState !== state
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid OAuth state"
            });

            return;
        }

        res.clearCookie(
            STATE_COOKIE,
            {
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            }
        );

        const { tokens } =
            await googleOAuthClient.getToken(code);

        if (!tokens.id_token) {
            res.status(401).json({
                success: false,
                message:
                    "Google did not return an ID token"
            });

            return;
        }

        const ticket =
            await googleOAuthClient.verifyIdToken({
                idToken: tokens.id_token,

                audience:
                    env.GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        if (!payload) {
            res.status(401).json({
                success: false,
                message:
                    "Unable to read Google identity"
            });

            return;
        }

        if (
            !payload.sub ||
            !payload.email
        ) {
            res.status(401).json({
                success: false,
                message:
                    "Google account information is incomplete"
            });

            return;
        }

        const user =
            await findOrCreateGoogleUser({
                googleId: payload.sub,

                email:
                    payload.email,

                name:
                    payload.name ??
                    payload.email,

                avatarUrl:
                    payload.picture
            });

        const token =
            signAuthToken({
                sub: user.id,

                email:
                    user.email,

                role:
                    user.role
            });

        res.cookie(
            "reachinbox_auth",
            token,
            {
                httpOnly: true,

                secure:
                    env.NODE_ENV === "production",

                sameSite: "lax",

                maxAge:
                    7 * 24 * 60 * 60 * 1000,

                path: "/"
            }
        );

        res.redirect(
            `${env.WEB_ORIGIN}/dashboard`
        );
    } catch (error) {
        console.error(
            "Google OAuth callback failed:",
            error
        );

        res.redirect(
            `${env.WEB_ORIGIN}/login?error=oauth_failed`
        );
    }
}

export async function getCurrentUser(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    res.json({
        success: true,

        data: {
            user: req.user
        }
    });
}

export function logout(
    _req: Request,
    res: Response
): void {
    res.clearCookie(
        "reachinbox_auth",
        {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        }
    );

    res.json({
        success: true,
        message: "Logged out successfully"
    });
}