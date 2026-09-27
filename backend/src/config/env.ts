import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    WEB_ORIGIN: z.string().url(),

    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),

    EMAIL_SEND_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),

    MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce
        .number()
        .int()
        .positive()
        .default(200),

    JOB_RETRY_ATTEMPTS: z.coerce.number().int().nonnegative().default(3),

    JOB_BACKOFF_MS: z.coerce.number().int().positive().default(5000),

    SESSION_SECRET: z.string().min(16),

    GOOGLE_CLIENT_ID: z.string().default(""),
    GOOGLE_CLIENT_SECRET: z.string().default(""),
    GOOGLE_CALLBACK_URL: z.string().url(),

    SMTP_ENCRYPTION_KEY: z.string().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;