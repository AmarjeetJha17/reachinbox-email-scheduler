import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import testJobRoutes from "./routes/test-job.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    cors({
        origin: env.WEB_ORIGIN,
        credentials: true
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(pinoHttp());

app.get("/", (_req, res) => {
    res.json({
        service: "reachinbox-email-scheduler",
        status: "running"
    });
});

app.use("/api/health", healthRoutes);
app.use("/api/test/jobs", testJobRoutes);

app.use(errorHandler);