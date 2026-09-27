import type {
    ErrorRequestHandler,
    Request
} from "express";

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