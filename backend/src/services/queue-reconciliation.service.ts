import {
    EmailJobStatus
} from "@prisma/client";

import {
    prisma
} from "../config/database.js";

import {
    emailQueue
} from "../queues/email.queue.js";

const STALE_PROCESSING_MS =
    15 * 60 * 1000;

const RECONCILIATION_BATCH_SIZE = 1000;

function calculateDelay(
    targetDate: Date
): number {
    return Math.max(
        0,
        targetDate.getTime() - Date.now()
    );
}

export async function resetStaleProcessingJobs() {
    const staleBefore =
        new Date(
            Date.now() -
            STALE_PROCESSING_MS
        );

    const result =
        await prisma.emailJob.updateMany({
            where: {
                status:
                    EmailJobStatus.PROCESSING,

                updatedAt: {
                    lt: staleBefore
                }
            },

            data: {
                status:
                    EmailJobStatus.QUEUED,

                nextAttemptAt: null,

                errorMessage:
                    "Recovered after stale processing state",

                failedAt: null
            }
        });

    if (result.count > 0) {
        console.log(
            `♻️ Recovered ${result.count} stale processing job(s)`
        );
    }

    return result.count;
}

export async function reconcileMissingQueueJobs() {
    const jobs =
        await prisma.emailJob.findMany({
            where: {
                status: {
                    in: [
                        EmailJobStatus.SCHEDULED,
                        EmailJobStatus.QUEUED,
                        EmailJobStatus.RATE_LIMITED
                    ]
                }
            },

            orderBy: [
                {
                    scheduledAt: "asc"
                },

                {
                    createdAt: "asc"
                }
            ],

            take:
                RECONCILIATION_BATCH_SIZE
        });

    let inspected = 0;
    let recreated = 0;

    for (const emailJob of jobs) {
        inspected++;

        const existingJob =
            await emailQueue.getJob(
                emailJob.id
            );

        /*
         * The job already exists in Redis/BullMQ.
         *
         * It may currently be:
         *
         * waiting
         * delayed
         * active
         * completed
         * failed
         *
         * We do not enqueue another one.
         */
        if (existingJob) {
            continue;
        }

        const targetTime =
            emailJob.nextAttemptAt ??
            emailJob.scheduledAt;

        const delay =
            calculateDelay(targetTime);

        try {
            await emailQueue.add(
                "send-email",
                {
                    emailJobId:
                        emailJob.id,

                    campaignId:
                        emailJob.campaignId,

                    senderId:
                        emailJob.senderId
                },

                {
                    jobId:
                        emailJob.id,

                    delay
                }
            );

            /*
             * Keep RATE_LIMITED visible when it was
             * deliberately delayed by the rate limiter.
             */
            if (
                emailJob.status !==
                EmailJobStatus.RATE_LIMITED
            ) {
                await prisma.emailJob.update({
                    where: {
                        id: emailJob.id
                    },

                    data: {
                        status:
                            EmailJobStatus.QUEUED
                    }
                });
            }

            recreated++;

            console.log(
                `🔄 Recreated BullMQ job ${emailJob.id} | delay=${delay}ms`
            );
        } catch (error) {
            console.error(
                `❌ Could not recreate job ${emailJob.id}:`,
                error
            );
        }
    }

    return {
        inspected,
        recreated
    };
}

export async function reconcileQueues() {
    console.log("");
    console.log(
        "======================================"
    );
    console.log(
        "🔎 Starting queue reconciliation"
    );
    console.log(
        "======================================"
    );

    const recovered =
        await resetStaleProcessingJobs();

    const result =
        await reconcileMissingQueueJobs();

    console.log(
        `✅ Reconciliation complete | inspected=${result.inspected} recreated=${result.recreated} staleRecovered=${recovered}`
    );

    console.log(
        "======================================"
    );
    console.log("");

    return {
        ...result,
        staleRecovered: recovered
    };
}