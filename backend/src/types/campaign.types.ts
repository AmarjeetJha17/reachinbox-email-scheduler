import { z } from "zod";

export const scheduleCampaignSchema = z
    .object({
        userId: z.string().uuid(),

        senderId: z.string().uuid(),

        subject: z
            .string()
            .trim()
            .min(1, "Subject is required")
            .max(200, "Subject must not exceed 200 characters"),

        body: z
            .string()
            .trim()
            .min(1, "Email body is required")
            .max(50_000, "Email body is too large"),

        startAt: z.coerce.date(),

        delayBetweenEmails: z.coerce
            .number()
            .int()
            .min(0)
            .max(600_000)
            .default(2_000),

        hourlyLimit: z.coerce
            .number()
            .int()
            .min(1)
            .max(10_000)
            .default(200),

        recipients: z
            .array(
                z.object({
                    email: z
                        .string()
                        .trim()
                        .toLowerCase()
                        .email("Invalid email address"),

                    name: z
                        .string()
                        .trim()
                        .max(200)
                        .optional()
                })
            )
            .min(1, "At least one recipient is required")
            .max(5_000, "A campaign cannot exceed 5,000 recipients")
    })
    .superRefine((data, ctx) => {
        if (data.startAt.getTime() <= Date.now()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["startAt"],
                message: "startAt must be in the future"
            });
        }

        const emails = data.recipients.map(
            (recipient) => recipient.email
        );

        const uniqueEmails = new Set(emails);

        if (uniqueEmails.size !== emails.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["recipients"],
                message: "Duplicate recipient email addresses are not allowed"
            });
        }
    });

export type ScheduleCampaignInput = z.infer<
    typeof scheduleCampaignSchema
>;