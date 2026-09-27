import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: {
            googleId: "development-google-id"
        },

        update: {},

        create: {
            googleId: "development-google-id",
            email: "dev@example.com",
            name: "Development User",
            avatarUrl: null
        }
    });

    const sender = await prisma.senderAccount.upsert({
        where: {
            id: "11111111-1111-4111-8111-111111111111"
        },

        update: {},

        create: {
            id: "11111111-1111-4111-8111-111111111111",

            userId: user.id,

            name: "Development Sender",
            fromEmail: "dev@example.com",

            smtpHost: "smtp.ethereal.email",
            smtpPort: 587,

            smtpUser: "placeholder",
            smtpPasswordEncrypted: "placeholder",

            secure: false,

            hourlyLimit: 20
        }
    });

    console.log("");
    console.log("======================================");
    console.log("🌱 Development seed complete");
    console.log("======================================");
    console.log("User ID:", user.id);
    console.log("User email:", user.email);
    console.log("Sender ID:", sender.id);
    console.log("======================================");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });