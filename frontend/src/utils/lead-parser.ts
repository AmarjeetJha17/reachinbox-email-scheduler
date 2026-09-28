import Papa from "papaparse";

export interface ParsedLeads {
    emails: string[];
    totalDetected: number;
    duplicateCount: number;
}

const EMAIL_REGEX =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function extractEmailsFromText(
    value: string
): string[] {
    return value.match(EMAIL_REGEX) ?? [];
}

function normalizeEmail(
    email: string
): string {
    return email.trim().toLowerCase();
}

export function parseTextContent(
    content: string
): ParsedLeads {
    const found =
        extractEmailsFromText(content)
            .map(normalizeEmail);

    const unique =
        [...new Set(found)];

    return {
        emails: unique,

        totalDetected:
            found.length,

        duplicateCount:
            found.length - unique.length
    };
}

export function parseCsvContent(
    content: string
): Promise<ParsedLeads> {
    return new Promise(
        (resolve, reject) => {
            Papa.parse<string[]>(
                content,
                {
                    skipEmptyLines: true,

                    complete: (
                        result
                    ) => {
                        const allEmails: string[] = [];

                        for (const row of result.data) {
                            for (const cell of row) {
                                if (
                                    typeof cell !==
                                    "string"
                                ) {
                                    continue;
                                }

                                const emails =
                                    extractEmailsFromText(
                                        cell
                                    );

                                for (const email of emails) {
                                    allEmails.push(
                                        normalizeEmail(
                                            email
                                        )
                                    );
                                }
                            }
                        }

                        const unique =
                            [...new Set(allEmails)];

                        resolve({
                            emails: unique,

                            totalDetected:
                                allEmails.length,

                            duplicateCount:
                                allEmails.length -
                                unique.length
                        });
                    },

                    error: (error: Error) => {
                        reject(error);
                    }
                }
            );
        }
    );
}

export async function parseLeadFile(
    file: File
): Promise<ParsedLeads> {
    const content =
        await file.text();

    const extension =
        file.name
            .split(".")
            .pop()
            ?.toLowerCase();

    if (
        extension === "csv"
    ) {
        return parseCsvContent(
            content
        );
    }

    if (
        extension === "txt"
    ) {
        return parseTextContent(
            content
        );
    }

    throw new Error(
        "Only CSV and TXT files are supported."
    );
}