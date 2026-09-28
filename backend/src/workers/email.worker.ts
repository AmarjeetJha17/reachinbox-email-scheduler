import {
    DelayedError,
    Job,
    Worker
} from "bullmq";

import {
    CampaignStatus,
    EmailJobStatus
} from "@prisma/client";

import {
    redisConnection
} from "../config/redis.js";

import {
    env
} from "../config/env.js";

import {
    prisma
} from "../config/database.js";

import {
    EMAIL_QUEUE_NAME,
    type EmailJobData
} from "../queues/email.queue.js";

import {
    sendEmail
} from "../services/email.service.js";

import {
    reserveSendSlot
} from "../services/rate-limiter.service.js";

async function refreshCampaignStatus(
    campaignId: string
): Promise<void> {
    const remainingJobs =
        await prisma.emailJob.count({
            where: {
                campaignId,

                status: {
                    in: [
                        EmailJobStatus.SCHEDULED,
                        EmailJobStatus.QUEUED,
                        EmailJobStatus.PROCESSING,
                        EmailJobStatus.RETRYING,
                        EmailJobStatus.RATE_LIMITED
                    ]
                }
            }
        });

    if (remainingJobs > 0) {
        return;
    }

    const failedJobs =
        await prisma.emailJob.count({
            where: {
                campaignId,

                status: EmailJobStatus.FAILED
            }
        });

    await prisma.campaign.update({
        where: {
            id: campaignId
        },

        data: {
            status:
                failedJobs > 0
                    ? CampaignStatus.FAILED
                    : CampaignStatus.COMPLETED
        }
    });
}

async function rateLimitAndDelayJob(
    job: Job<EmailJobData>,
    emailJobId: string,
    nextAllowedAt: number,
    token?: string
): Promise<never> {
    if (!token) {
        throw new Error(
            `Missing BullMQ worker token for delayed job ${job.id}`
        );
    }

    const delayUntil =
        Math.max(
            nextAllowedAt,
            Date.now() + 100
        );

    await prisma.emailJob.updateMany({
        where: {
            id: emailJobId,

            status:
                EmailJobStatus.PROCESSING
        },

        data: {
            status:
                EmailJobStatus.RATE_LIMITED,

            nextAttemptAt:
                new Date(delayUntil)
        }
    });

    await job.moveToDelayed(
        delayUntil,
        token
    );

    console.log("");
    console.log("======================================");
    console.log("⏳ Email rate limited");
    console.log("Job:", emailJobId);
    console.log(
        "Rescheduled:",
        new Date(delayUntil).toISOString()
    );
    console.log("======================================");

    /*
     * This tells BullMQ:
     *
     * "The job has intentionally been moved
     * back to delayed state. Do not mark it
     * completed or failed."
     */
    throw new DelayedError();
}

const worker =
    new Worker<EmailJobData>(
        EMAIL_QUEUE_NAME,

        async (
            job: Job<EmailJobData>,
            token?: string
        ) => {
            const {
                emailJobId,
                campaignId,
                senderId
            } = job.data;

            /*
             * --------------------------------------------------
             * STEP 1 — Claim the logical EmailJob
             * --------------------------------------------------
             */
            const claim =
                await prisma.emailJob.updateMany({
                    where: {
                        id: emailJobId,

                        status: {
                            in: [
                                EmailJobStatus.SCHEDULED,
                                EmailJobStatus.QUEUED,
                                EmailJobStatus.RETRYING,
                                EmailJobStatus.RATE_LIMITED
                            ]
                        }
                    },

                    data: {
                        status:
                            EmailJobStatus.PROCESSING,

                        errorMessage: null
                    }
                });

            /*
             * Another worker already owns/completed
             * this logical email.
             */
            if (claim.count === 0) {
                console.log(
                    `↩️ Skipping already-claimed job ${emailJobId}`
                );

                return {
                    skipped: true,
                    reason:
                        "already_claimed_or_completed"
                };
            }

            /*
             * --------------------------------------------------
             * STEP 2 — Load current persistent state
             * --------------------------------------------------
             */
            const emailJob =
                await prisma.emailJob.findUnique({
                    where: {
                        id: emailJobId
                    },

                    include: {
                        campaign: true
                    }
                });

            if (!emailJob) {
                throw new Error(
                    `EmailJob ${emailJobId} no longer exists`
                );
            }

            /*
             * Already sent due to an unusual recovery race.
             */
            if (
                emailJob.status ===
                EmailJobStatus.SENT
            ) {
                return {
                    skipped: true,
                    reason: "already_sent"
                };
            }

            const sender =
                await prisma.senderAccount.findUnique({
                    where: {
                        id: senderId
                    }
                });

            if (!sender) {
                throw new Error(
                    `Sender ${senderId} no longer exists`
                );
            }

            /*
             * The effective hourly limit is the tighter
             * of sender-level and campaign-level settings.
             */
            const hourlyLimit =
                Math.min(
                    sender.hourlyLimit,
                    emailJob.campaign.hourlyLimit
                );

            /*
             * --------------------------------------------------
             * STEP 3 — Distributed Redis rate-limit reservation
             * --------------------------------------------------
             */
            const rateLimitResult =
                await reserveSendSlot({
                    senderId: sender.id,

                    maxEmailsPerHour:
                        hourlyLimit,

                    minDelayMs:
                        emailJob.campaign
                            .delayBetweenEmails
                });

            if (!rateLimitResult.allowed) {
                await rateLimitAndDelayJob(
                    job,
                    emailJob.id,

                    rateLimitResult.nextAllowedAt,

                    token
                );
            }

            /*
             * --------------------------------------------------
             * STEP 4 — Actual send attempt
             * --------------------------------------------------
             */
            const updatedAttempt =
                await prisma.emailJob.updateMany({
                    where: {
                        id: emailJob.id,

                        status:
                            EmailJobStatus.PROCESSING
                    },

                    data: {
                        attemptCount: {
                            increment: 1
                        }
                    }
                });

            if (updatedAttempt.count === 0) {
                return {
                    skipped: true,
                    reason:
                        "lost_processing_claim"
                };
            }

            console.log("");
            console.log("======================================");
            console.log("📨 Sending email");
            console.log("Job:", emailJob.id);
            console.log(
                "Campaign:",
                campaignId
            );
            console.log(
                "To:",
                emailJob.recipientEmail
            );
            console.log(
                "Attempt:",
                emailJob.attemptCount + 1
            );
            console.log(
                "Hourly limit:",
                hourlyLimit
            );
            console.log(
                "Rate count:",
                rateLimitResult.count
            );
            console.log("======================================");

            try {
                const result =
                    await sendEmail(
                        sender,
                        emailJob
                    );

                /*
                 * ------------------------------------------------
                 * STEP 5 — Persist successful delivery
                 * ------------------------------------------------
                 */
                await prisma.emailJob.update({
                    where: {
                        id: emailJob.id
                    },

                    data: {
                        status:
                            EmailJobStatus.SENT,

                        sentAt:
                            new Date(),

                        providerMessageId:
                            result.messageId,

                        previewUrl:
                            result.previewUrl,

                        errorMessage: null,

                        nextAttemptAt: null
                    }
                });

                await refreshCampaignStatus(
                    campaignId
                );

                console.log(
                    `✅ Email sent: ${emailJob.recipientEmail}`
                );

                if (result.previewUrl) {
                    console.log(
                        `🔗 Preview: ${result.previewUrl}`
                    );
                }

                return {
                    sent: true,

                    messageId:
                        result.messageId,

                    previewUrl:
                        result.previewUrl
                };
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unknown SMTP error";

                const maxAttempts =
                    job.opts.attempts ??
                    env.JOB_RETRY_ATTEMPTS;

                /*
                 * BullMQ's attemptsMade is the number
                 * of previous failed processing attempts.
                 */
                const finalAttempt =
                    job.attemptsMade + 1 >=
                    maxAttempts;

                await prisma.emailJob.updateMany({
                    where: {
                        id: emailJob.id,

                        status:
                            EmailJobStatus.PROCESSING
                    },

                    data: {
                        status:
                            finalAttempt
                                ? EmailJobStatus.FAILED
                                : EmailJobStatus.RETRYING,

                        failedAt:
                            finalAttempt
                                ? new Date()
                                : null,

                        errorMessage:
                            message,

                        nextAttemptAt:
                            finalAttempt
                                ? null
                                : new Date(
                                    Date.now() +
                                    env.JOB_BACKOFF_MS
                                )
                    }
                });

                if (finalAttempt) {
                    await refreshCampaignStatus(
                        campaignId
                    );
                }

                console.error(
                    `❌ Email failed: ${emailJob.recipientEmail}`,
                    message
                );

                throw error instanceof Error
                    ? error
                    : new Error(message);
            }
        },

        {
            connection:
                redisConnection,

            concurrency:
                env.WORKER_CONCURRENCY
        }
    );

worker.on("ready", () => {
    console.log(
        `✅ Email worker ready | concurrency=${env.WORKER_CONCURRENCY}`
    );
});

worker.on("completed", (job) => {
    console.log(
        `✅ BullMQ job completed: ${job.id}`
    );
});

worker.on("failed", (job, error) => {
    console.error(
        `❌ BullMQ job failed: ${job?.id}`,
        error.message
    );
});

worker.on("error", (error) => {
    console.error(
        "❌ Worker error:",
        error
    );
});

async function shutdown(
    signal: string
) {
    console.log(
        `\n${signal} received. Shutting down worker...`
    );

    await worker.close();

    await prisma.$disconnect();

    await redisConnection.quit();

    console.log(
        "✅ Worker shutdown complete"
    );

    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});