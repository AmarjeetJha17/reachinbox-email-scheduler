import type {
    Request,
    Response,
    NextFunction
} from "express";

import {
    scheduleCampaignSchema
} from "../types/campaign.types.js";

import {
    scheduleCampaign
} from "../services/campaign.service.js";

export async function scheduleCampaignController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const parsed =
            scheduleCampaignSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid scheduling request",
                errors: parsed.error.flatten()
            });

            return;
        }

        const result =
            await scheduleCampaign(parsed.data);

        res.status(202).json({
            success: true,
            message: "Campaign scheduled successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
}