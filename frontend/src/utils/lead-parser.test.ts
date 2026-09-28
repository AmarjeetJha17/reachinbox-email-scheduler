import { describe, expect, it } from "vitest";

import {
  parseTextContent,
  parseCsvContent
} from "./lead-parser";

describe("lead parser", () => {
  it("extracts unique emails from text", () => {
    const result = parseTextContent(`
      amar@example.com
      rahul@example.com
      AMAR@example.com
      invalid-email
    `);

    expect(result.emails).toEqual([
      "amar@example.com",
      "rahul@example.com"
    ]);

    expect(result.totalDetected).toBe(3);
    expect(result.duplicateCount).toBe(1);
  });

  it("extracts emails from multiple CSV columns", async () => {
    const result = await parseCsvContent(`
      Name,Company,Contact
      Amar,ABC,amar@example.com
      Rahul,XYZ,rahul@example.com
      Duplicate,ABC,amar@example.com
    `);

    expect(result.emails).toEqual([
      "amar@example.com",
      "rahul@example.com"
    ]);

    expect(result.totalDetected).toBe(3);
    expect(result.duplicateCount).toBe(1);
  });

  it("normalizes uppercase email addresses", () => {
    const result = parseTextContent(
      "AMAR@EXAMPLE.COM"
    );

    expect(result.emails).toEqual([
      "amar@example.com"
    ]);
  });
});
