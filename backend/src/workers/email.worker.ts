import { Job, Worker } from "bullmq";

import {
    EmailJobStatus,
    CampaignStatus
} from "@prisma/client";

import { redisConnection } from "../config/redis.js";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";

import {
    EMAIL_QUEUE_NAME,
    type EmailJobData
} from "../queues/email.queue.js";

import {
    sendEmail
} from "../services/email.service.js";

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

const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,

    async (job: Job<EmailJobData>) => {
        const {
            emailJobId,
            campaignId,
            senderId
        } = job.data;

        /*
         * STEP 1
         * Atomically claim the database job.
         *
         * This prevents two workers from processing the
         * same logical EmailJob simultaneously.
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
                    status: EmailJobStatus.PROCESSING,

                    attemptCount: {
                        increment: 1
                    },

                    errorMessage: null
                }
            });

        /*
         * Another worker already owns/completed it.
         */
        if (claim.count === 0) {
            console.log(
                `↩️ Skipping already-claimed job ${emailJobId}`
            );

            return {
                skipped: true,
                reason: "already_processed_or_processing"
            };
        }

        const emailJob =
            await prisma.emailJob.findUnique({
                where: {
                    id: emailJobId
                }
            });

        if (!emailJob) {
            throw new Error(
                `EmailJob ${emailJobId} no longer exists`
            );
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

        console.log("");
        console.log("======================================");
        console.log("📨 Processing email");
        console.log("Job:", emailJob.id);
        console.log("Campaign:", campaignId);
        console.log("To:", emailJob.recipientEmail);
        console.log("Attempt:", emailJob.attemptCount);
        console.log("======================================");

        try {
            const result =
                await sendEmail(sender, emailJob);

            await prisma.emailJob.update({
                where: {
                    id: emailJob.id
                },

                data: {
                    status: EmailJobStatus.SENT,

                    sentAt: new Date(),

                    providerMessageId:
                        result.messageId,

                    previewUrl:
                        result.previewUrl,

                    errorMessage: null
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

            /*
             * BullMQ's attemptsMade is the number of
             * previous failed processing attempts.
             *
             * If this error exhausts configured attempts,
             * mark the DB job permanently FAILED.
             * Otherwise leave it RETRYING so the next
             * BullMQ attempt can claim it.
             */
            const maxAttempts =
                job.opts.attempts ??
                env.JOB_RETRY_ATTEMPTS;

            const nextAttemptWillBeFinal =
                job.attemptsMade + 1 >= maxAttempts;

            await prisma.emailJob.updateMany({
                where: {
                    id: emailJob.id,

                    status:
                        EmailJobStatus.PROCESSING
                },

                data: {
                    status:
                        nextAttemptWillBeFinal
                            ? EmailJobStatus.FAILED
                            : EmailJobStatus.RETRYING,

                    failedAt:
                        nextAttemptWillBeFinal
                            ? new Date()
                            : null,

                    errorMessage: message,

                    nextAttemptAt:
                        nextAttemptWillBeFinal
                            ? null
                            : new Date(
                                Date.now() +
                                env.JOB_BACKOFF_MS
                            )
                }
            });

            if (nextAttemptWillBeFinal) {
                await refreshCampaignStatus(
                    campaignId
                );
            }

            console.error(
                `❌ Email failed: ${emailJob.recipientEmail}`,
                message
            );

            /*
             * Important: throw an Error so BullMQ
             * activates its configured retry mechanism.
             */
            throw error instanceof Error
                ? error
                : new Error(message);
        }
    },

    {
        connection: redisConnection,

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