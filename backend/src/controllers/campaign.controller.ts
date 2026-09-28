import type {
    Response,
    NextFunction
} from "express";

import {
    scheduleCampaignSchema
} from "../types/campaign.types.js";

import {
    scheduleCampaign
} from "../services/campaign.service.js";

import type {
    AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export async function scheduleCampaignController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const parsed =
            scheduleCampaignSchema.safeParse(
                req.body
            );

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid scheduling request",
                errors:
                    parsed.error.flatten()
            });

            return;
        }

        const result =
            await scheduleCampaign({
                ...parsed.data,

                userId:
                    req.user!.id
            });

        res.status(202).json({
            success: true,

            message:
                "Campaign scheduled successfully",

            data: result
        });
    } catch (error) {
        next(error);
    }
}