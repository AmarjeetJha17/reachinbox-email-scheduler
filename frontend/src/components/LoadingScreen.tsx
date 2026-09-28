export function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />

                <p className="text-sm text-neutral-500">
                    Loading ReachInbox...
                </p>
            </div>
        </div>
    );
}