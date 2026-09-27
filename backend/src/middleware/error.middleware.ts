import type {
    ErrorRequestHandler,
    Request
} from "express";

import { AppError } from "../utils/app-error.js";

export const errorHandler: ErrorRequestHandler = (
    err,
    req: Request,
    res,
    _next
) => {
    console.error("Unhandled error:", err);

    if (res.headersSent) {
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            path: req.path
        });

        return;
    }

    res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err instanceof Error
                    ? err.message
                    : "Internal server error",
        path: req.path
    });
};