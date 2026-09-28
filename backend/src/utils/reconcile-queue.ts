import {
    prisma
} from "../config/database.js";

import {
    redisConnection
} from "../config/redis.js";

import {
    reconcileQueues
} from "../services/queue-reconciliation.service.js";

async function main() {
    await reconcileQueues();
}

main()
    .catch((error) => {
        console.error(
            "❌ Queue reconciliation failed:",
            error
        );

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();

        await redisConnection.quit();
    });