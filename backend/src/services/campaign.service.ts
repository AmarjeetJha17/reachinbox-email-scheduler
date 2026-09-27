import crypto from "node:crypto";

import {
    CampaignStatus,
    EmailJobStatus,
    SenderStatus
} from "@prisma/client";

import { prisma } from "../config/database.js";
import { emailQueue } from "../queues/email.queue.js";
import { AppError } from "../utils/app-error.js";
import type { ScheduleCampaignInput } from "../types/campaign.types.js";

export async function scheduleCampaign(
    input: ScheduleCampaignInput
) {
    const campaignData = await prisma.$transaction(async (tx) => {
        const sender = await tx.senderAccount.findFirst({
            where: {
                id: input.senderId,
                userId: input.userId,
                status: SenderStatus.ACTIVE
            }
        });

        if (!sender) {
            throw new AppError(
                404,
                "Sender account was not found or is not active"
            );
        }

        const campaign = await tx.campaign.create({
            data: {
                userId: input.userId,
                senderId: input.senderId,
                subject: input.subject,
                body: input.body,
                startAt: input.startAt,
                delayBetweenEmails: input.delayBetweenEmails,
                hourlyLimit: input.hourlyLimit,
                status: CampaignStatus.SCHEDULED
            }
        });

        const emailJobs = input.recipients.map(
            (recipient, index) => {
                const id = crypto.randomUUID();

                const scheduledAt = new Date(
                    input.startAt.getTime() +
                    index * input.delayBetweenEmails
                );

                return {
                    id,
                    campaignId: campaign.id,
                    senderId: input.senderId,

                    recipientEmail: recipient.email,
                    recipientName: recipient.name ?? null,

                    subject: input.subject,
                    body: input.body,

                    scheduledAt,

                    status: EmailJobStatus.SCHEDULED,

                    bullJobId: id,

                    idempotencyKey: `${campaign.id}-${index}`,

                    attemptCount: 0
                };
            }
        );

        await tx.emailJob.createMany({
            data: emailJobs
        });

        return {
            campaign,
            emailJobs
        };
    });

    /*
     * PostgreSQL is now the source of truth.
     *
     * The BullMQ jobs are created only after the database
     * transaction successfully commits.
     */
    try {
        await emailQueue.addBulk(
            campaignData.emailJobs.map((job) => ({
                name: "send-email" as const,

                data: {
                    emailJobId: job.id,
                    campaignId: job.campaignId,
                    senderId: job.senderId
                },

                opts: {
                    jobId: job.id,
                    delay: Math.max(
                        0,
                        job.scheduledAt.getTime() - Date.now()
                    )
                }
            }))
        );
    } catch (error) {
        console.error(
            "Failed to enqueue campaign jobs:",
            error
        );

        /*
         * Leave the DB rows as SCHEDULED.
         * Phase 5 will add a reconciliation mechanism which
         * can safely enqueue missing jobs.
         */
        throw new AppError(
            503,
            "Campaign was saved, but queueing the email jobs failed"
        );
    }

    await prisma.emailJob.updateMany({
        where: {
            id: {
                in: campaignData.emailJobs.map((job) => job.id)
            }
        },

        data: {
            status: EmailJobStatus.QUEUED
        }
    });

    return {
        campaign: campaignData.campaign,

        totalRecipients:
            campaignData.emailJobs.length,

        scheduledJobs:
            campaignData.emailJobs.map((job) => ({
                id: job.id,
                recipientEmail: job.recipientEmail,
                scheduledAt: job.scheduledAt
            }))
    };
}