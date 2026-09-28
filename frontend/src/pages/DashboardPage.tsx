import {
    CheckCircle2,
    Clock3,
    Mail,
    Send
} from "lucide-react";

import {
    useEffect,
    useState
} from "react";

import { api } from "../services/api";
import type {
    EmailJob
} from "../types/api";

import {
    StatusBadge
} from "../components/StatusBadge";

function formatDate(
    value: string | null
) {
    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleString();
}

function EmailTable({
    jobs,
    emptyMessage
}: {
    jobs: EmailJob[];
    emptyMessage: string;
}) {
    if (jobs.length === 0) {
        return (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <Mail
                        size={20}
                        className="text-neutral-400"
                    />
                </div>

                <p className="mt-4 text-sm font-medium text-neutral-700">
                    Nothing here yet
                </p>

                <p className="mt-1 text-sm text-neutral-400">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            Recipient
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            Subject
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            Time
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            Status
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                    {jobs.map((job) => (
                        <tr
                            key={job.id}
                            className="transition hover:bg-neutral-50"
                        >
                            <td className="px-5 py-4">
                                <p className="text-sm font-medium text-neutral-800">
                                    {job.recipientName ||
                                        job.recipientEmail}
                                </p>

                                {job.recipientName && (
                                    <p className="mt-0.5 text-xs text-neutral-400">
                                        {job.recipientEmail}
                                    </p>
                                )}
                            </td>

                            <td className="max-w-xs truncate px-5 py-4 text-sm text-neutral-600">
                                {job.subject}
                            </td>

                            <td className="px-5 py-4 text-sm text-neutral-500">
                                {formatDate(
                                    job.sentAt ||
                                    job.scheduledAt
                                )}
                            </td>

                            <td className="px-5 py-4">
                                <StatusBadge
                                    status={job.status}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function DashboardPage() {
    const [
        scheduled,
        setScheduled
    ] = useState<EmailJob[]>([]);

    const [
        sent,
        setSent
    ] = useState<EmailJob[]>([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState<string | null>(
        null
    );

    async function loadDashboard() {
        try {
            setLoading(true);
            setError(null);

            const [
                scheduledResponse,
                sentResponse
            ] = await Promise.all([
                api.get<{
                    success: boolean;
                    data: {
                        jobs: EmailJob[];
                    };
                }>("/emails/scheduled"),

                api.get<{
                    success: boolean;
                    data: {
                        jobs: EmailJob[];
                    };
                }>("/emails/sent")
            ]);

            setScheduled(
                scheduledResponse.data.data.jobs
            );

            setSent(
                sentResponse.data.data.jobs
            );
        } catch (err) {
            console.error(err);

            setError(
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadDashboard();
    }, []);

    const scheduledCount =
        scheduled.length;

    const sentCount =
        sent.length;

    const failedCount =
        sent.filter(
            (job) => job.status === "FAILED"
        ).length;

    return (
        <main>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-neutral-400">
                        Workspace
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                        Email Overview
                    </h1>

                    <p className="mt-2 text-sm text-neutral-500">
                        Monitor scheduled and delivered emails.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Clock3}
                    label="Scheduled"
                    value={
                        loading
                            ? "—"
                            : String(scheduledCount)
                    }
                />

                <StatCard
                    icon={Send}
                    label="Sent"
                    value={
                        loading
                            ? "—"
                            : String(sentCount)
                    }
                />

                <StatCard
                    icon={CheckCircle2}
                    label="Successful"
                    value={
                        loading
                            ? "—"
                            : String(
                                sentCount -
                                failedCount
                            )
                    }
                />

                <StatCard
                    icon={Mail}
                    label="Failed"
                    value={
                        loading
                            ? "—"
                            : String(failedCount)
                    }
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-5 py-4">
                    <h2 className="font-semibold">
                        Scheduled Emails
                    </h2>

                    <p className="mt-1 text-sm text-neutral-400">
                        Upcoming email jobs and their current status.
                    </p>
                </div>

                {loading ? (
                    <TableSkeleton />
                ) : (
                    <EmailTable
                        jobs={scheduled}
                        emptyMessage="Schedule a campaign to see upcoming emails."
                    />
                )}
            </section>

            <section className="mt-7 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-5 py-4">
                    <h2 className="font-semibold">
                        Sent Emails
                    </h2>

                    <p className="mt-1 text-sm text-neutral-400">
                        Delivery history from your campaigns.
                    </p>
                </div>

                {loading ? (
                    <TableSkeleton />
                ) : (
                    <EmailTable
                        jobs={sent}
                        emptyMessage="Sent emails will appear here after delivery."
                    />
                )}
            </section>
        </main>
    );
}

function StatCard({
    icon: Icon,
    label,
    value
}: {
    icon: typeof Clock3;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                    <Icon size={18} className="text-neutral-600" />
                </div>

                <span className="text-2xl font-semibold">
                    {value}
                </span>
            </div>

            <p className="mt-4 text-sm text-neutral-500">
                {label}
            </p>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4 p-5">
            {Array.from({
                length: 4
            }).map((_, index) => (
                <div
                    key={index}
                    className="grid animate-pulse grid-cols-4 gap-4"
                >
                    <div className="h-5 rounded bg-neutral-100" />
                    <div className="h-5 rounded bg-neutral-100" />
                    <div className="h-5 rounded bg-neutral-100" />
                    <div className="h-5 rounded bg-neutral-100" />
                </div>
            ))}
        </div>
    );
}