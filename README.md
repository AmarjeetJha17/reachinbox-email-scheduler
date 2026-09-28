## Reliability & Recovery

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
