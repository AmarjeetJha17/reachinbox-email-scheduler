import {
    ArrowLeft,
    CalendarClock,
    Send
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState
} from "react";
import type { FormEvent } from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import { api } from "../services/api";
import type {
    SenderAccount,
    ScheduleEmailRequest
} from "../types/api";

export function ComposePage() {
    const navigate =
        useNavigate();

    const [
        senders,
        setSenders
    ] = useState<SenderAccount[]>([]);

    const [
        subject,
        setSubject
    ] = useState("");

    const [
        body,
        setBody
    ] = useState("");

    const [
        senderId,
        setSenderId
    ] = useState("");

    const [
        startAt,
        setStartAt
    ] = useState("");

    const [
        delay,
        setDelay
    ] = useState("2000");

    const [
        hourlyLimit,
        setHourlyLimit
    ] = useState("20");

    const [
        recipientsText,
        setRecipientsText
    ] = useState("");

    const [
        submitting,
        setSubmitting
    ] = useState(false);

    const [
        error,
        setError
    ] = useState<string | null>(
        null
    );

    const [
        success,
        setSuccess
    ] = useState(false);

    useEffect(() => {
        async function loadSenders() {
            try {
                const response =
                    await api.get<{
                        success: boolean;
                        data: {
                            senders: SenderAccount[];
                        };
                    }>("/senders");

                const activeSenders =
                    response.data.data.senders
                        .filter(
                            (sender) =>
                                sender.status ===
                                "ACTIVE"
                        );

                setSenders(activeSenders);

                if (activeSenders.length > 0) {
                    setSenderId(
                        activeSenders[0].id
                    );

                    setHourlyLimit(
                        String(
                            activeSenders[0]
                                .hourlyLimit
                        )
                    );
                }
            } catch (err) {
                console.error(err);

                setError(
                    "Unable to load sender accounts."
                );
            }
        }

        void loadSenders();
    }, []);

    const recipients =
        useMemo(() => {
            const lines =
                recipientsText
                    .split(/[\n,;]/)
                    .map(
                        (value) =>
                            value.trim().toLowerCase()
                    )
                    .filter(Boolean);

            return [
                ...new Set(lines)
            ];
        }, [recipientsText]);

    async function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(false);

        if (
            !senderId ||
            !subject.trim() ||
            !body.trim() ||
            !startAt ||
            recipients.length === 0
        ) {
            setError(
                "Please complete all required fields."
            );

            return;
        }

        try {
            setSubmitting(true);

            const payload: ScheduleEmailRequest = {
                senderId,

                subject:
                    subject.trim(),

                body:
                    body.trim(),

                startAt:
                    new Date(
                        startAt
                    ).toISOString(),

                delayBetweenEmails:
                    Number(delay),

                hourlyLimit:
                    Number(hourlyLimit),

                recipients:
                    recipients.map(
                        (email) => ({
                            email
                        })
                    )
            };

            await api.post(
                "/campaigns/schedule",
                payload
            );

            setSuccess(true);

            setSubject("");
            setBody("");
            setRecipientsText("");

            setTimeout(() => {
                navigate("/dashboard");
            }, 900);
        } catch (err) {
            console.error(err);

            setError(
                "Unable to schedule the campaign."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <div className="mb-7">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>

                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                    Compose New Email
                </h1>

                <p className="mt-2 text-sm text-neutral-500">
                    Prepare a campaign and schedule its delivery.
                </p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Campaign scheduled successfully. Returning
                    to dashboard...
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="grid gap-7 lg:grid-cols-[1fr_360px]"
            >
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                    <div className="mb-6">
                        <label
                            htmlFor="sender"
                            className="mb-2 block text-sm font-medium text-neutral-800"
                        >
                            Sender
                        </label>

                        <select
                            id="sender"
                            value={senderId}
                            onChange={(event) => {
                                const nextId =
                                    event.target.value;

                                setSenderId(nextId);

                                const sender =
                                    senders.find(
                                        (item) =>
                                            item.id ===
                                            nextId
                                    );

                                if (sender) {
                                    setHourlyLimit(
                                        String(
                                            sender.hourlyLimit
                                        )
                                    );
                                }
                            }}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
                            required
                        >
                            <option value="">
                                Select sender
                            </option>

                            {senders.map(
                                (sender) => (
                                    <option
                                        key={sender.id}
                                        value={sender.id}
                                    >
                                        {sender.name} — {sender.fromEmail}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="subject"
                            className="mb-2 block text-sm font-medium text-neutral-800"
                        >
                            Subject
                        </label>

                        <input
                            id="subject"
                            value={subject}
                            onChange={(event) =>
                                setSubject(
                                    event.target.value
                                )
                            }
                            placeholder="Your email subject"
                            className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-500"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="body"
                            className="mb-2 block text-sm font-medium text-neutral-800"
                        >
                            Message
                        </label>

                        <textarea
                            id="body"
                            value={body}
                            onChange={(event) =>
                                setBody(
                                    event.target.value
                                )
                            }
                            placeholder="Write your email message..."
                            rows={12}
                            className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-300 focus:border-neutral-500"
                            required
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label
                                htmlFor="recipients"
                                className="block text-sm font-medium text-neutral-800"
                            >
                                Recipients
                            </label>

                            <span className="text-xs text-neutral-400">
                                {recipients.length} detected
                            </span>
                        </div>

                        <textarea
                            id="recipients"
                            value={recipientsText}
                            onChange={(event) =>
                                setRecipientsText(
                                    event.target.value
                                )
                            }
                            placeholder={`recipient1@example.com
recipient2@example.com`}
                            rows={7}
                            className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 font-mono text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-500"
                            required
                        />

                        <p className="mt-2 text-xs text-neutral-400">
                            For now, enter one email per line, comma, or
                            semicolon. CSV import is added in Phase 8.
                        </p>
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                            <CalendarClock size={19} />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold">
                                Delivery Settings
                            </h2>

                            <p className="text-xs text-neutral-400">
                                Control when and how fast the campaign runs.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="startAt"
                                className="mb-2 block text-sm font-medium"
                            >
                                Start time
                            </label>

                            <input
                                id="startAt"
                                type="datetime-local"
                                value={startAt}
                                onChange={(event) =>
                                    setStartAt(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-500"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="delay"
                                className="mb-2 block text-sm font-medium"
                            >
                                Delay between emails
                            </label>

                            <div className="flex items-center gap-2">
                                <input
                                    id="delay"
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={delay}
                                    onChange={(event) =>
                                        setDelay(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-500"
                                    required
                                />

                                <span className="text-xs text-neutral-400">
                                    ms
                                </span>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="hourlyLimit"
                                className="mb-2 block text-sm font-medium"
                            >
                                Hourly sender limit
                            </label>

                            <input
                                id="hourlyLimit"
                                type="number"
                                min="1"
                                value={hourlyLimit}
                                onChange={(event) =>
                                    setHourlyLimit(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-500"
                                required
                            />
                        </div>

                        <div className="rounded-xl bg-neutral-50 p-4">
                            <p className="text-xs font-medium text-neutral-700">
                                Campaign summary
                            </p>

                            <div className="mt-3 space-y-2 text-xs text-neutral-500">
                                <div className="flex justify-between gap-3">
                                    <span>Recipients</span>
                                    <span className="font-medium text-neutral-800">
                                        {recipients.length}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span>Delay</span>
                                    <span className="font-medium text-neutral-800">
                                        {Number(delay) / 1000}s
                                    </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span>Hourly limit</span>
                                    <span className="font-medium text-neutral-800">
                                        {hourlyLimit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                senders.length === 0
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Send size={17} />
                                    Schedule Campaign
                                </>
                            )}
                        </button>
                    </div>
                </aside>
            </form>
        </main>
    );
}