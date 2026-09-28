import type { EmailJobStatus } from "../types/api";

interface StatusBadgeProps {
    status: EmailJobStatus;
}

export function StatusBadge({
    status
}: StatusBadgeProps) {
    const styles: Record<
        EmailJobStatus,
        string
    > = {
        SCHEDULED:
            "bg-blue-50 text-blue-700 ring-blue-600/10",

        QUEUED:
            "bg-violet-50 text-violet-700 ring-violet-600/10",

        PROCESSING:
            "bg-amber-50 text-amber-700 ring-amber-600/10",

        SENT:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

        FAILED:
            "bg-red-50 text-red-700 ring-red-600/10",

        RETRYING:
            "bg-orange-50 text-orange-700 ring-orange-600/10",

        RATE_LIMITED:
            "bg-yellow-50 text-yellow-700 ring-yellow-600/10",

        CANCELLED:
            "bg-neutral-100 text-neutral-600 ring-neutral-500/10"
    };

    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                styles[status]
            ].join(" ")}
        >
            {status.replaceAll("_", " ")}
        </span>
    );
}