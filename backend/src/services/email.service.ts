import nodemailer, {
    type Transporter
} from "nodemailer";

import type {
    EmailJob,
    SenderAccount
} from "@prisma/client";

import { decryptSecret } from "../utils/crypto.js";

interface SendEmailResult {
    messageId: string;
    previewUrl: string | null;
}

const transporterCache =
    new Map<string, Transporter>();

function getTransporter(
    sender: SenderAccount
): Transporter {
    const cached = transporterCache.get(sender.id);

    if (cached) {
        return cached;
    }

    const transporter = nodemailer.createTransport({
        host: sender.smtpHost,
        port: sender.smtpPort,
        secure: sender.secure,

        auth: {
            user: sender.smtpUser,
            pass: decryptSecret(
                sender.smtpPasswordEncrypted
            )
        }
    });

    transporterCache.set(sender.id, transporter);

    return transporter;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function textToHtml(value: string): string {
    return escapeHtml(value)
        .replaceAll("\r\n", "\n")
        .replaceAll("\n", "<br />");
}

export async function sendEmail(
    sender: SenderAccount,
    emailJob: EmailJob
): Promise<SendEmailResult> {
    const transporter = getTransporter(sender);

    const fromAddress = `"${sender.name}" <${sender.fromEmail}>`;

    const toAddress = emailJob.recipientName
        ? `"${emailJob.recipientName}" <${emailJob.recipientEmail}>`
        : emailJob.recipientEmail;

    /*
     * Deterministic Message-ID for this logical email job.
     *
     * This improves observability and makes the same job
     * identifiable across retries.
     */
    const messageId =
        `<${emailJob.id}@reachinbox.local>`;

    const info = await transporter.sendMail({
        from: fromAddress,
        to: toAddress,

        subject: emailJob.subject,

        text: emailJob.body,

        html: textToHtml(emailJob.body),

        messageId,

        headers: {
            "X-ReachInbox-Email-Job": emailJob.id,
            "X-ReachInbox-Campaign": emailJob.campaignId
        }
    });

    return {
        messageId: info.messageId,
        previewUrl:
            nodemailer.getTestMessageUrl(info) || null
    };
}