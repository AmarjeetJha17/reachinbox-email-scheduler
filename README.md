# ReachInbox Email Scheduler

## Overview

Production-oriented email scheduling platform built using
React, Express, PostgreSQL, Redis, BullMQ and Ethereal SMTP.

## Architecture

```text
React
 ↓
Express
 ├── PostgreSQL
 └── Redis/BullMQ
       ↓
     Worker
       ↓
   Rate Limiter
       ↓
   Ethereal SMTP
```

## Features

- Google OAuth
- Multiple sender accounts
- CSV/TXT lead import
- Email scheduling
- Delayed BullMQ jobs
- Per-sender hourly rate limiting
- Minimum send delay
- Concurrent workers
- Idempotent job processing
- Retry/backoff
- Restart recovery
- Queue reconciliation
- Scheduled/Sent dashboard

## Technology

- Node.js
- TypeScript
- Express
- React
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Nodemailer
- Ethereal
- Docker

## Local Setup

### 1. Clone repository

### 2. Configure environment

Copy:

```bash
cp .env.example .env
```

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Run migrations

```bash
npx prisma migrate dev
```

### 6. Seed development data

```bash
npx prisma db seed
```

### 7. Start backend

```bash
npm run dev
```

### 8. Start worker

```bash
npm run worker
```

### 9. Start frontend

```bash
cd frontend
npm install
npm run dev
```

## Docker Setup

```bash
docker compose up -d --build
```

## Authentication

Google OAuth authorization-code flow.

## Scheduling

BullMQ delayed jobs are used instead of cron.

## Rate Limiting

Per-sender distributed rate limiting is implemented with Redis
atomic operations.

## Concurrency

Worker concurrency is configurable through:

`WORKER_CONCURRENCY`

## Reliability

PostgreSQL is the source of truth for campaign and email-job state.
Redis/BullMQ is the execution and delayed-job layer.

Scheduled email jobs are persisted in both PostgreSQL and BullMQ.

On worker startup, the application runs a reconciliation process
that:

1. Recovers stale PROCESSING records older than 15 minutes.
2. Finds SCHEDULED/QUEUED/RATE_LIMITED EmailJob records.
3. Checks whether the corresponding BullMQ job exists.
4. Recreates missing delayed jobs using the EmailJob ID as the
   deterministic BullMQ job ID.

Email scheduling itself does not use cron. Delayed delivery is
handled by BullMQ.

The 15-minute stale-processing threshold is intentionally longer
than the expected SMTP processing time. This provides a recovery
window for worker crashes while minimizing the possibility of
resetting a legitimately long-running send operation.

## Idempotency

EmailJob IDs are deterministic BullMQ job IDs and unique
database identifiers.

## Retry Behavior

SMTP failures use BullMQ retry/backoff.

## Trade-offs

Document:

- **conservative rate-limit reservation**: The rate limiter reserves capacity upfront before sending to guarantee limits aren't exceeded, which may lead to brief capacity locks under high concurrency.
- **SMTP crash window**: If the worker process crashes after sending an email but before updating PostgreSQL, the job may remain stuck in PROCESSING.
- **15-minute stale-processing threshold**: Provides a wide buffer to accommodate sluggish SMTP servers without premature retries, but delays recovery of genuinely crashed jobs by 15 minutes.
- **browser-side CSV parsing**: Offloads parsing overhead from the backend, but is constrained by browser memory (though well within the 5MB file upload limit).
- **Ethereal as test SMTP**: Safely traps and displays emails for development testing without actually delivering them to real addresses.
