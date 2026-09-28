import {
    Mail,
    ShieldCheck
} from "lucide-react";

export function LoginPage() {
    function loginWithGoogle() {
        window.location.href =
            `${import.meta.env.VITE_API_URL}/auth/google`;
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
                <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
                    <section>
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-950">
                            <Mail size={23} />
                        </div>

                        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">
                            ReachInbox
                        </p>

                        <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                            Simple, reliable email scheduling.
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-7 text-neutral-400">
                            Schedule campaigns, control delivery
                            rates, and monitor every email from
                            one workspace.
                        </p>
                    </section>

                    <section className="rounded-3xl border border-neutral-800 bg-white p-8 text-neutral-900 shadow-2xl">
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold">
                                Welcome back
                            </h2>

                            <p className="mt-2 text-sm text-neutral-500">
                                Sign in to access your email scheduler.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loginWithGoogle}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-neutral-50"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M21.35 12.23c0-.78-.07-1.53-.22-2.23H12v4.22h5.24a4.47 4.47 0 0 1-1.95 2.94v2.45h3.15c1.85-1.7 2.91-4.21 2.91-7.38Z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 21.98c2.65 0 4.87-.88 6.5-2.37l-3.15-2.45c-.87.58-1.98.92-3.35.92-2.57 0-4.75-1.73-5.53-4.06H3.22v2.52A9.81 9.81 0 0 0 12 21.98Z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M6.47 14.02A5.9 5.9 0 0 1 6.16 12c0-.7.12-1.38.31-2.02V7.46H3.22A10 10 0 0 0 2.16 12c0 1.63.39 3.16 1.06 4.54l3.25-2.52Z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.92c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.87 2.95 14.65 2.02 12 2.02a9.81 9.81 0 0 0-8.78 5.44l3.25 2.52C7.25 7.65 9.43 5.92 12 5.92Z"
                                />
                            </svg>

                            Continue with Google
                        </button>

                        <div className="mt-6 flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
                            <ShieldCheck
                                size={18}
                                className="mt-0.5 shrink-0 text-neutral-600"
                            />

                            <p className="text-xs leading-5 text-neutral-500">
                                Your authentication is handled securely
                                through Google OAuth. We only request basic
                                account identity information.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}