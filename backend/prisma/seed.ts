import nodemailer from "nodemailer";

import {
    PrismaClient
} from "@prisma/client";

import {
    encryptSecret
} from "../src/utils/crypto.js";

const prisma = new PrismaClient();

async function main() {
    console.log("Creating Ethereal test account...");

    const ethereal =
        await nodemailer.createTestAccount();

    console.log(
        "✅ Ethereal account created:",
        ethereal.user
    );

    const user = await prisma.user.upsert({
        where: {
            googleId: "development-google-id"
        },

        update: {},

        create: {
            googleId: "development-google-id",

            email: "dev@example.com",

            name: "Development User"
        }
    });

    const sender = await prisma.senderAccount.upsert({
        where: {
            id: "11111111-1111-4111-8111-111111111111"
        },

        update: {
            userId: user.id,

            name: "Development Ethereal Sender",

            fromEmail: ethereal.user,

            smtpHost: ethereal.smtp.host,

            smtpPort: ethereal.smtp.port,

            smtpUser: ethereal.user,

            smtpPasswordEncrypted:
                encryptSecret(ethereal.pass),

            secure: ethereal.smtp.secure,

            hourlyLimit: 20
        },

        create: {
            id: "11111111-1111-4111-8111-111111111111",

            userId: user.id,

            name: "Development Ethereal Sender",

            fromEmail: ethereal.user,

            smtpHost: ethereal.smtp.host,

            smtpPort: ethereal.smtp.port,

            smtpUser: ethereal.user,

            smtpPasswordEncrypted:
                encryptSecret(ethereal.pass),

            secure: ethereal.smtp.secure,

            hourlyLimit: 20
        }
    });

    console.log("");
    console.log("======================================");
    console.log("🌱 Development seed complete");
    console.log("======================================");
    console.log("User ID:", user.id);
    console.log("User:", user.email);
    console.log("Sender:", sender.fromEmail);
    console.log("SMTP:", sender.smtpHost);
    console.log("Port:", sender.smtpPort);
    console.log("======================================");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });