import {
    UserRole
} from "@prisma/client";

import { prisma } from "../config/database.js";

interface GoogleUser {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

export async function findOrCreateGoogleUser(
    googleUser: GoogleUser
) {
    const existing =
        await prisma.user.findUnique({
            where: {
                googleId: googleUser.googleId
            }
        });

    if (existing) {
        return prisma.user.update({
            where: {
                id: existing.id
            },

            data: {
                email: googleUser.email,
                name: googleUser.name,
                avatarUrl:
                    googleUser.avatarUrl ?? null
            }
        });
    }

    /*
     * Email uniqueness protects us from accidentally
     * creating two application users with the same email.
     */
    const byEmail =
        await prisma.user.findUnique({
            where: {
                email: googleUser.email
            }
        });

    if (byEmail) {
        return prisma.user.update({
            where: {
                id: byEmail.id
            },

            data: {
                googleId: googleUser.googleId,
                name: googleUser.name,
                avatarUrl:
                    googleUser.avatarUrl ?? null
            }
        });
    }

    return prisma.user.create({
        data: {
            googleId:
                googleUser.googleId,

            email:
                googleUser.email,

            name:
                googleUser.name,

            avatarUrl:
                googleUser.avatarUrl ?? null,

            role:
                UserRole.USER
        }
    });
}