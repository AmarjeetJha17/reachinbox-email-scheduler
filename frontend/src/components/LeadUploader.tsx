import {
    FileText,
    Upload,
    X
} from "lucide-react";

import {
    useRef,
    useState
} from "react";

import {
    parseLeadFile
} from "../utils/lead-parser";

interface LeadUploaderProps {
    emails: string[];

    onEmailsChange: (
        emails: string[]
    ) => void;
}

export function LeadUploader({
    emails,
    onEmailsChange
}: LeadUploaderProps) {
    const inputRef =
        useRef<HTMLInputElement>(null);

    const [
        fileName,
        setFileName
    ] = useState<string | null>(
        null
    );

    const [
        detectedCount,
        setDetectedCount
    ] = useState(0);

    const [
        duplicateCount,
        setDuplicateCount
    ] = useState(0);

    const [
        parsing,
        setParsing
    ] = useState(false);

    const [
        error,
        setError
    ] = useState<string | null>(
        null
    );

    async function handleFile(
        file: File
    ) {
        setError(null);

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                "File size must be 5 MB or smaller."
            );

            return;
        }

        setParsing(true);

        try {
            const result =
                await parseLeadFile(file);

            setFileName(file.name);

            setDetectedCount(
                result.totalDetected
            );

            setDuplicateCount(
                result.duplicateCount
            );

            onEmailsChange(
                result.emails
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to parse file."
            );

            setFileName(null);
            setDetectedCount(0);
            setDuplicateCount(0);
            onEmailsChange([]);
        } finally {
            setParsing(false);
        }
    }

    function handleInputChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (file) {
            void handleFile(file);
        }
    }

    function clearFile() {
        setFileName(null);
        setDetectedCount(0);
        setDuplicateCount(0);
        setError(null);
        onEmailsChange([]);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-neutral-800">
                    Lead List
                </label>

                <span className="text-xs text-neutral-400">
                    CSV or TXT
                </span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleInputChange}
                className="hidden"
            />

            {!fileName ? (
                <button
                    type="button"
                    onClick={() =>
                        inputRef.current?.click()
                    }
                    className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition hover:border-neutral-500 hover:bg-neutral-100"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                        <Upload
                            size={20}
                            className="text-neutral-500"
                        />
                    </div>

                    <p className="mt-4 text-sm font-medium text-neutral-800">
                        Upload your leads
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                        Click to select a CSV or TXT file
                    </p>

                    <p className="mt-3 text-[11px] text-neutral-400">
                        Email addresses can appear in any CSV column.
                    </p>
                </button>
            ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                            <FileText size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {fileName}
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                                {parsing
                                    ? "Parsing file..."
                                    : `${emails.length} unique email${emails.length === 1 ? "" : "s"} ready`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={clearFile}
                            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
                            title="Remove file"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    {!parsing && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-neutral-50 p-3">
                                <p className="text-xs text-neutral-400">
                                    Detected
                                </p>

                                <p className="mt-1 text-lg font-semibold">
                                    {detectedCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-50 p-3">
                                <p className="text-xs text-neutral-400">
                                    Duplicates removed
                                </p>

                                <p className="mt-1 text-lg font-semibold">
                                    {duplicateCount}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-2 text-xs text-red-600">
                    {error}
                </p>
            )}

            {emails.length > 0 && (
                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Preview
                        </p>

                        <p className="text-xs text-neutral-400">
                            Showing first {Math.min(
                                emails.length,
                                10
                            )}
                        </p>
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50">
                        {emails
                            .slice(0, 10)
                            .map((email) => (
                                <div
                                    key={email}
                                    className="border-b border-neutral-100 px-3 py-2 font-mono text-xs text-neutral-600 last:border-0"
                                >
                                    {email}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}