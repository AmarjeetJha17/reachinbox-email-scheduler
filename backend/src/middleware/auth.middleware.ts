import type {
    Request,
    Response,
    NextFunction
} from "express";

import {
    verifyAuthToken
} from "../utils/jwt.js";

import { prisma } from "../config/database.js";

export interface AuthenticatedRequest
    extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: "USER" | "ADMIN";
        avatarUrl: string | null;
    };
}

export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token =
            req.cookies?.reachinbox_auth;

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });

            return;
        }

        const payload =
            verifyAuthToken(token);

        const user =
            await prisma.user.findUnique({
                where: {
                    id: payload.sub
                },

                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    avatarUrl: true
                }
            });

        if (!user) {
            res.status(401).json({
                success: false,
                message: "User account no longer exists"
            });

            return;
        }

        req.user = user;

        next();
    } catch (error) {
        console.error(
            "Authentication failed:",
            error
        );

        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication"
        });
    }
}