import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { env } from "../config/env.js";

export const EMAIL_QUEUE_NAME = "email-send";

export interface TestEmailJobData {
    message: string;
    createdAt: string;
}

export const emailQueue = new Queue<TestEmailJobData>(EMAIL_QUEUE_NAME, {
    connection: redisConnection,

    defaultJobOptions: {
        attempts: env.JOB_RETRY_ATTEMPTS,

        backoff: {
            type: "exponential",
            delay: env.JOB_BACKOFF_MS
        },

        removeOnComplete: {
            age: 60 * 60,
            count: 1000
        },

        removeOnFail: {
            age: 24 * 60 * 60,
            count: 5000
        }
    }
});