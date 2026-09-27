import crypto from "node:crypto";

import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
    const key = Buffer.from(
        env.SMTP_ENCRYPTION_KEY,
        "base64"
    );

    if (key.length !== KEY_LENGTH) {
        throw new Error(
            "SMTP_ENCRYPTION_KEY must decode to exactly 32 bytes"
        );
    }

    return key;
}

export function encryptSecret(value: string): string {
    const key = getKey();

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        key,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64")
    ].join(".");
}

export function decryptSecret(payload: string): string {
    const key = getKey();

    const [ivBase64, authTagBase64, encryptedBase64] =
        payload.split(".");

    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
        throw new Error("Invalid encrypted secret format");
    }

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const encrypted = Buffer.from(
        encryptedBase64,
        "base64"
    );

    if (
        iv.length !== IV_LENGTH ||
        authTag.length !== AUTH_TAG_LENGTH
    ) {
        throw new Error("Invalid encrypted secret payload");
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
}