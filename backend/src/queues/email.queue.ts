import { Queue } from "bullmq";

import { redisConnection } from "../config/redis.js";
import { env } from "../config/env.js";

export const EMAIL_QUEUE_NAME = "email-send";

export interface EmailJobData {
    emailJobId: string;
    campaignId: string;
    senderId: string;
}

export const emailQueue = new Queue<EmailJobData>(
    EMAIL_QUEUE_NAME,
    {
        connection: redisConnection,

        defaultJobOptions: {
            attempts: env.JOB_RETRY_ATTEMPTS,

            backoff: {
                type: "exponential",
                delay: env.JOB_BACKOFF_MS
            },

            removeOnComplete: {
                age: 24 * 60 * 60,
                count: 10_000
            },

            removeOnFail: {
                age: 7 * 24 * 60 * 60,
                count: 10_000
            }
        }
    }
);