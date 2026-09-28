export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: "USER" | "ADMIN";
}

export interface SenderAccount {
    id: string;
    name: string;
    fromEmail: string;
    hourlyLimit: number;
    status: "ACTIVE" | "PAUSED";
}

export type EmailJobStatus =
    | "SCHEDULED"
    | "QUEUED"
    | "PROCESSING"
    | "SENT"
    | "FAILED"
    | "RETRYING"
    | "RATE_LIMITED"
    | "CANCELLED";

export interface EmailJob {
    id: string;
    campaignId: string;
    recipientEmail: string;
    recipientName: string | null;
    subject: string;
    scheduledAt: string;
    nextAttemptAt: string | null;
    status: EmailJobStatus;
    attemptCount: number;
    sentAt: string | null;
    failedAt: string | null;
    providerMessageId: string | null;
    previewUrl: string | null;
    errorMessage: string | null;
}

export interface ScheduleEmailRequest {
    senderId: string;
    subject: string;
    body: string;
    startAt: string;
    delayBetweenEmails: number;
    hourlyLimit: number;
    recipients: Array<{
        email: string;
        name?: string;
    }>;
}