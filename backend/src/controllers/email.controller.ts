import type {
    Response,
    NextFunction
} from "express";

import type {
    AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import {
    prisma
} from "../config/database.js";

export async function getScheduledEmails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const jobs =
            await prisma.emailJob.findMany({
                where: {
                    campaign: {
                        userId:
                            req.user!.id
                    },

                    status: {
                        in: [
                            "SCHEDULED",
                            "QUEUED",
                            "PROCESSING",
                            "RETRYING",
                            "RATE_LIMITED"
                        ]
                    }
                },

                orderBy: [
                    {
                        scheduledAt:
                            "asc"
                    },

                    {
                        createdAt:
                            "desc"
                    }
                ],

                take: 500
            });

        res.json({
            success: true,

            data: {
                jobs
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getSentEmails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const jobs =
            await prisma.emailJob.findMany({
                where: {
                    campaign: {
                        userId:
                            req.user!.id
                    },

                    status: {
                        in: [
                            "SENT",
                            "FAILED"
                        ]
                    }
                },

                orderBy: {
                    sentAt:
                        "desc"
                },

                take: 500
            });

        res.json({
            success: true,

            data: {
                jobs
            }
        });
    } catch (error) {
        next(error);
    }
}