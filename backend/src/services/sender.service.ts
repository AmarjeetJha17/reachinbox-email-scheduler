import { SenderStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { encryptSecret } from "../utils/crypto.js";
import { AppError } from "../utils/app-error.js";
import type { CreateSenderInput } from "../types/sender.types.js";

export async function createSender(userId: string, input: CreateSenderInput) {
  const duplicate = await prisma.senderAccount.findFirst({
    where: {
      userId,
      fromEmail: input.fromEmail
    }
  });

  if (duplicate) {
    throw new AppError(409, "A sender with this email already exists");
  }

  return prisma.senderAccount.create({
    data: {
      userId,
      name: input.name,
      fromEmail: input.fromEmail,
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpUser: input.smtpUser,
      smtpPasswordEncrypted: encryptSecret(input.smtpPassword),
      secure: input.secure,
      hourlyLimit: input.hourlyLimit,
      status: SenderStatus.ACTIVE
    },
    select: {
      id: true,
      name: true,
      fromEmail: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      secure: true,
      hourlyLimit: true,
      status: true,
      createdAt: true
    }
  });
}
