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

export async function getSenders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const senders =
            await prisma.senderAccount.findMany({
                where: {
                    userId:
                        req.user!.id
                },

                select: {
                    id: true,
                    name: true,
                    fromEmail: true,
                    hourlyLimit: true,
                    status: true
                },

                orderBy: {
                    createdAt: "asc"
                }
            });

        res.json({
            success: true,

            data: {
                senders
            }
        });
    } catch (error) {
        next(error);
    }
}