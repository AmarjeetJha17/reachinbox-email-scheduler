import type { Request, Response, NextFunction } from "express";
import { emailQueue } from "../queues/email.queue.js";

export async function createTestJob(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const message =
            typeof req.body?.message === "string" && req.body.message.trim()
                ? req.body.message.trim()
                : "Hello from ReachInbox";

        const delaySeconds = Number(req.body?.delaySeconds ?? 5);

        if (!Number.isFinite(delaySeconds) || delaySeconds < 0) {
            res.status(400).json({
                success: false,
                message: "delaySeconds must be a non-negative number"
            });
            return;
        }

        const delayMs = Math.round(delaySeconds * 1000);

        const job = await emailQueue.add(
            "test-email",
            {
                message,
                createdAt: new Date().toISOString()
            },
            {
                delay: delayMs
            }
        );

        res.status(202).json({
            success: true,
            message: "Test job scheduled",
            data: {
                jobId: job.id,
                delayMs,
                scheduledFor: new Date(Date.now() + delayMs).toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
}