import { redisConnection } from "../config/redis.js";

const HOUR_MS = 60 * 60 * 1000;

const RATE_LIMIT_SCRIPT = `
local count = tonumber(redis.call("GET", KEYS[1]) or "0")
local nextAllowedAt = tonumber(redis.call("GET", KEYS[2]) or "0")

local maxEmails = tonumber(ARGV[1])
local nowMs = tonumber(ARGV[2])
local windowEndMs = tonumber(ARGV[3])
local minDelayMs = tonumber(ARGV[4])

-- Hourly limit has been reached.
if count >= maxEmails then
    return {0, windowEndMs, 1, count}
end

-- Minimum delay between email send attempts has not elapsed.
if nowMs < nextAllowedAt then
    return {0, nextAllowedAt, 2, count}
end

-- Reserve this send slot atomically.
local newCount = redis.call("INCR", KEYS[1])

if newCount == 1 then
    local ttl = windowEndMs - nowMs

    if ttl < 1000 then
        ttl = 1000
    end

    redis.call("PEXPIRE", KEYS[1], ttl)
end

local newNextAllowedAt = nowMs + minDelayMs

redis.call(
    "SET",
    KEYS[2],
    newNextAllowedAt,
    "PX",
    math.max(3600000, minDelayMs + 60000)
)

return {1, nowMs, 0, newCount}
`;

export interface RateLimitResult {
    allowed: boolean;

    nextAllowedAt: number;

    reason:
    | "allowed"
    | "hourly_limit"
    | "minimum_delay";

    count: number;
}

function getHourWindow(nowMs: number) {
    const windowStart =
        Math.floor(nowMs / HOUR_MS) * HOUR_MS;

    const windowEnd =
        windowStart + HOUR_MS;

    return {
        windowStart,
        windowEnd
    };
}

export async function reserveSendSlot(params: {
    senderId: string;
    maxEmailsPerHour: number;
    minDelayMs: number;
    nowMs?: number;
}): Promise<RateLimitResult> {
    const nowMs = params.nowMs ?? Date.now();

    const {
        windowStart,
        windowEnd
    } = getHourWindow(nowMs);

    /*
     * Counter is scoped to:
     *
     * sender + UTC hour
     */
    const counterKey =
        `email:rate:${params.senderId}:${windowStart}`;

    /*
     * Minimum-delay state persists independently
     * so the delay is not reset at the top of the hour.
     */
    const nextAllowedKey =
        `email:spacing:${params.senderId}`;

    const result =
        (await redisConnection.eval(
            RATE_LIMIT_SCRIPT,
            2,

            counterKey,
            nextAllowedKey,

            params.maxEmailsPerHour,
            nowMs,
            windowEnd,
            params.minDelayMs
        )) as number[];

    const [
        allowedFlag,
        nextAllowedAt,
        reasonCode,
        count
    ] = result;

    if (allowedFlag === 1) {
        return {
            allowed: true,
            nextAllowedAt,
            reason: "allowed",
            count
        };
    }

    if (reasonCode === 1) {
        return {
            allowed: false,
            nextAllowedAt,
            reason: "hourly_limit",
            count
        };
    }

    return {
        allowed: false,
        nextAllowedAt,
        reason: "minimum_delay",
        count
    };
}