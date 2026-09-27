import { Job, Worker } from "bullmq";
import {
    EMAIL_QUEUE_NAME,
    type TestEmailJobData
} from "../queues/email.queue.js";
import { redisConnection } from "../config/redis.js";
import { env } from "../config/env.js";

const worker = new Worker<TestEmailJobData>(
    EMAIL_QUEUE_NAME,

    async (job: Job<TestEmailJobData>) => {
        console.log("======================================");
        console.log("📨 Processing job");
        console.log("Job ID:", job.id);
        console.log("Job name:", job.name);
        console.log("Message:", job.data.message);
        console.log("Created at:", job.data.createdAt);
        console.log("======================================");

        return {
            processed: true,
            processedAt: new Date().toISOString()
        };
    },

    {
        connection: redisConnection,
        concurrency: env.WORKER_CONCURRENCY
    }
);

worker.on("ready", () => {
    console.log(
        `✅ Email worker ready | concurrency=${env.WORKER_CONCURRENCY}`
    );
});

worker.on("completed", (job) => {
    console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
    console.error(`❌ Job failed: ${job?.id}`, error);
});

worker.on("error", (error) => {
    console.error("❌ Worker error:", error);
});

async function shutdown(signal: string) {
    console.log(`\n${signal} received. Shutting down worker...`);

    await worker.close();
    await redisConnection.quit();

    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});