import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { redisConnection } from "../config/redis.js";

export async function healthCheck(
    _req: Request,
    res: Response
): Promise<void> {
    const startedAt = Date.now();

    let database = "unknown";
    let redis = "unknown";

    try {
        await prisma.$queryRaw`SELECT 1`;
        database = "healthy";
    } catch (error) {
        console.error("Database health check failed:", error);
        database = "unhealthy";
    }

    try {
        await redisConnection.ping();
        redis = "healthy";
    } catch (error) {
        console.error("Redis health check failed:", error);
        redis = "unhealthy";
    }

    const healthy = database === "healthy" && redis === "healthy";

    res.status(healthy ? 200 : 503).json({
        success: healthy,
        service: "reachinbox-email-scheduler",
        status: healthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        dependencies: {
            database,
            redis
        },
        responseTimeMs: Date.now() - startedAt
    });
}