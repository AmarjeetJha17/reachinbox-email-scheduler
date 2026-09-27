import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { redisConnection } from "./config/redis.js";

async function bootstrap() {
    try {
        await prisma.$connect();
        console.log("✅ PostgreSQL connected");

        await redisConnection.ping();
        console.log("✅ Redis connection verified");

        const server = app.listen(env.PORT, () => {
            console.log("");
            console.log("======================================");
            console.log("🚀 ReachInbox backend started");
            console.log(`🌐 http://localhost:${env.PORT}`);
            console.log(`🏥 http://localhost:${env.PORT}/api/health`);
            console.log("======================================");
        });

        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down...`);

            server.close(async () => {
                await prisma.$disconnect();
                await redisConnection.quit();

                console.log("✅ Shutdown complete");
                process.exit(0);
            });
        };

        process.on("SIGINT", () => {
            void shutdown("SIGINT");
        });

        process.on("SIGTERM", () => {
            void shutdown("SIGTERM");
        });
    } catch (error) {
        console.error("❌ Application startup failed:", error);

        await prisma.$disconnect().catch(() => { });
        await redisConnection.quit().catch(() => { });

        process.exit(1);
    }
}

void bootstrap();