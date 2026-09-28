# ReachInbox Email Scheduler

## Project Overview

A production-oriented email scheduling platform built using React, Express, PostgreSQL, Redis, BullMQ and Ethereal SMTP. It is designed to handle scheduled email campaigns with strict rate limiting, concurrent processing, robust retry mechanisms, and crash recovery.

## Architecture

```text
                    ┌──────────────────┐
                    │ React Frontend   │
                    │ TypeScript       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Express API      │
                    └───────┬──────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ PostgreSQL   │        │ Redis        │
        │ Prisma       │        │ BullMQ       │
        └──────────────┘        └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Worker       │
                                │ Concurrency  │
                                └──────┬───────┘
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                       Rate Limiter        SMTP Send
                         Redis             Ethereal
```

## Tech Stack

- **Node.js / Express** (Backend API & Worker)
- **TypeScript** (Strict typings across the stack)
- **React / Vite** (Frontend SPA)
- **PostgreSQL / Prisma** (Primary database & ORM)
- **Redis / BullMQ** (Job queue & atomic rate limiting)
- **Nodemailer** (SMTP integration)
- **Docker / Docker Compose** (Containerization)
- **Vitest** (Testing framework)

## Prerequisites

- Node.js (v24 or later recommended)
- Docker Desktop (or separate PostgreSQL & Redis installations)
- A Google Cloud Platform project (for OAuth credentials)
- An Ethereal Email account (for safe SMTP testing)

## Environment Variables

Copy `.env.example` to `.env` in the root folder:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Connection string to PostgreSQL
- `REDIS_URL`: Connection string to Redis
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `JWT_SECRET`: For session management
- `WORKER_CONCURRENCY`: Controls the number of emails the worker can process concurrently.

## Setup Instructions

### Google OAuth Setup
1. Go to the Google Cloud Console.
2. Create a new project and configure the OAuth consent screen.
3. Create OAuth 2.0 Client IDs (Web application).
4. Add authorized redirect URIs (e.g., `http://localhost:5173/`).
5. Copy the Client ID and Secret into your `.env` file.

### Ethereal Setup
1. Go to https://ethereal.email/ and create an account.
2. Ethereal credentials are automatically provisioned by the seed script, but you can also configure your own via the UI.

### Database, Redis/BullMQ Setup
Start the local infrastructure using Docker:
```bash
docker compose up -d postgres redis
```

### Local Setup
Install backend dependencies and prepare the database:
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

Start the backend API server:
```bash
npm run dev
```

### Worker Setup
In a separate terminal, start the background worker:
```bash
cd backend
npm run worker
```

### Frontend Setup
In a separate terminal, start the React application:
```bash
cd frontend
npm install
npm run dev
```

## Docker Setup (Full Stack)

To run the entire application (Frontend, Backend, Worker, DB, Redis) in production mode via Docker Compose:
```bash
docker compose up -d --build
```
The frontend will be available at `http://localhost`, and the API at `http://localhost:4000`.

## Testing

Run tests across the frontend and backend using Vitest:
```bash
cd backend && npm test
cd frontend && npm test
```

## Core Features & Mechanics

### CSV/TXT Format
The frontend accepts both `.csv` and `.txt` file uploads (up to 5MB). The lead parser scans the text block, automatically extracts valid email addresses, and discards duplicates, ignoring headers or specific column names.

### Scheduling Behavior
Instead of a polling `cron` job, the platform utilizes **BullMQ delayed jobs**. When a campaign is scheduled, jobs are instantly pushed to Redis with an execution delay timestamp. This ensures precise, immediate execution when the time comes.

### Rate Limiting
Per-sender rate limiting is enforced precisely. A sliding-window or atomic Redis operations are used to reserve capacity before attempting to send an email. If the hourly limit is reached, the job is bounced back to BullMQ with a calculated delay until the next available slot.

### Concurrency
Worker concurrency is strictly managed via the `WORKER_CONCURRENCY` environment variable. BullMQ handles fetching jobs concurrently while ensuring safe parallel execution without overlapping same-job processing.

### Idempotency
Email delivery is idempotent. The system uses the database-generated `EmailJob.id` as the deterministic BullMQ `jobId`. This ensures that even in the case of network glitches or retry loops, an email job is never queued or processed twice.

### Restart Recovery & Reconciliation
**PostgreSQL is the source of truth.** Redis/BullMQ is purely the execution layer.
When the worker process starts (or restarts after a crash), a **Reconciliation Process** runs:
1. It recovers stale `PROCESSING` records older than 15 minutes.
2. It finds all `SCHEDULED`, `QUEUED`, or `RATE_LIMITED` records in PostgreSQL.
3. It validates if the corresponding job exists in BullMQ.
4. If missing (e.g., Redis was flushed), it seamlessly recreates the delayed BullMQ job using the deterministic `jobId`.

## Assumptions
- The maximum file upload size of 5 MB is sufficient for assessment purposes.
- Ethereal SMTP is used as the primary testing ground to avoid real-world spam policies during development.
- Google OAuth is sufficient for user authentication.

## Trade-offs
- **Conservative rate-limit reservation:** The system reserves limit capacity *before* sending. This ensures limits are never exceeded but can briefly lock capacity if an SMTP send fails immediately.
- **SMTP crash window:** If the worker crashes immediately *after* Ethereal accepts the email but *before* marking it as sent in PostgreSQL, the job may remain in `PROCESSING` and eventually be retried. Real-world systems might require stricter message-id deduplication logs.
- **15-minute stale-processing threshold:** Provides an extremely safe recovery window for legitimately slow SMTP operations. The trade-off is a 15-minute delay in recovering crashed jobs.
- **Browser-side CSV parsing:** Client-side parsing shifts CPU load off the backend server, which is highly scalable, but it relies on browser memory constraints.
- **Ethereal as test SMTP:** Protects users from spamming real emails during development but hides real-world delivery complexities like bounces, reputation, and hard blocks.

## Demo Instructions

1. **Reset State:** Run `cd backend && npm run reset:rate-limit` to clear Redis rate-limiting keys for a clean start.
2. **Login:** Open the frontend, authenticate via Google OAuth.
3. **Upload Leads:** Upload a `.csv` or `.txt` file containing test emails.
4. **Schedule:** Compose a subject and body, set an hourly limit and delay, and schedule the campaign.
5. **Observe:** Watch the dashboard update statuses in real-time as the worker picks up jobs, processes them, respects the rate limits, and marks them as sent.
