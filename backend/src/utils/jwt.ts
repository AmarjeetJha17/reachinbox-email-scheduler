import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const JWT_EXPIRES_IN = "7d";

export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: "USER" | "ADMIN";
}

export function signAuthToken(
    payload: AuthTokenPayload
): string {
    return jwt.sign(
        payload,
        env.SESSION_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
}

export function verifyAuthToken(
    token: string
): AuthTokenPayload {
    return jwt.verify(
        token,
        env.SESSION_SECRET
    ) as AuthTokenPayload;
}