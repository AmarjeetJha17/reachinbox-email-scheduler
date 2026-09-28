import { createSenderSchema } from "../types/sender.types.js";
import { createSender } from "../services/sender.service.js";

import type {
    Response,
    NextFunction
} from "express";

import type {
    AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import {
    prisma
} from "../config/database.js";

export async function getSenders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const senders =
            await prisma.senderAccount.findMany({
                where: {
                    userId:
                        req.user!.id
                },

                select: {
                    id: true,
                    name: true,
                    fromEmail: true,
                    hourlyLimit: true,
                    status: true
                },

                orderBy: {
                    createdAt: "asc"
                }
            });

        res.json({
            success: true,

            data: {
                senders
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function createSenderController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createSenderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid sender configuration",
        errors: parsed.error.flatten()
      });
      return;
    }

    const sender = await createSender(req.user!.id, parsed.data);

    res.status(201).json({
      success: true,
      message: "Sender created successfully",
      data: { sender }
    });
  } catch (error) {
    next(error);
  }
}