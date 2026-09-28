import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import authRoutes from "./routes/auth.routes.js";
import senderRoutes from "./routes/sender.routes.js";
import emailRoutes from "./routes/email.routes.js";
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

app.use(cookieParser());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(pinoHttp());

app.get("/", (_req, res) => {
    res.json({
        service: "reachinbox-email-scheduler",
        status: "running"
    });
});

app.use(
    "/api/health",
    healthRoutes
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/senders",
    senderRoutes
);

app.use(
    "/api/emails",
    emailRoutes
);

app.use(
    "/api/campaigns",
    campaignRoutes
);

app.use(errorHandler);