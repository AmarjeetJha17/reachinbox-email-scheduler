import {
    redisConnection
} from "../config/redis.js";

async function main() {
    const patterns = [
        "email:rate:*",
        "email:spacing:*"
    ];

    let deleted = 0;

    for (const pattern of patterns) {
        const keys =
            await redisConnection.keys(
                pattern
            );

        if (keys.length === 0) {
            continue;
        }

        deleted +=
            await redisConnection.del(
                ...keys
            );
    }

    console.log(
        `✅ Removed ${deleted} development rate-limit key(s)`
    );
}

main()
    .catch((error) => {
        console.error(
            "❌ Failed to reset rate limits:",
            error
        );

        process.exitCode = 1;
    })
    .finally(async () => {
        await redisConnection.quit();
    });