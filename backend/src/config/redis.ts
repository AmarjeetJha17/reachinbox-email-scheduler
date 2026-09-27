import IORedis from "ioredis";
import { env } from "./env.js";

export const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

redisConnection.on("connect", () => {
    console.log("✅ Redis connected");
});

redisConnection.on("error", (error) => {
    console.error("❌ Redis error:", error);
});