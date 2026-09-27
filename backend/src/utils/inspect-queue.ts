import { emailQueue } from "../queues/email.queue.js";
import { redisConnection } from "../config/redis.js";

async function main() {
    const counts = await emailQueue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed"
    );

    console.log("Queue counts:");
    console.log(counts);

    const delayedJobs =
        await emailQueue.getJobs(["delayed"], 0, 20);

    console.log("\nDelayed jobs:");

    for (const job of delayedJobs) {
        console.log({
            id: job.id,
            name: job.name,
            data: job.data
        });
    }

    await emailQueue.close();
    await redisConnection.quit();
}

void main();