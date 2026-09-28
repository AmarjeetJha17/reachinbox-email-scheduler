import { z } from "zod";

export const createSenderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  fromEmail: z.string().trim().email(),
  smtpHost: z.string().trim().min(1),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().trim().min(1),
  smtpPassword: z.string().min(1),
  secure: z.boolean().default(false),
  hourlyLimit: z.coerce.number().int().min(1).max(10_000).default(200)
});

export type CreateSenderInput = z.infer<typeof createSenderSchema>;
