import {
  describe,
  expect,
  it
} from "vitest";

import {
  encryptSecret,
  decryptSecret
} from "./crypto";

describe(
  "secret encryption",
  () => {
    it("encrypts and decrypts correctly", () => {
      const original =
        "super-secret-password";

      const encrypted =
        encryptSecret(
          original
        );

      expect(encrypted).not.toBe(
        original
      );

      const decrypted =
        decryptSecret(
          encrypted
        );

      expect(decrypted).toBe(
        original
      );
    });

    it("produces different encrypted values", () => {
      const first =
        encryptSecret("password");

      const second =
        encryptSecret("password");

      expect(first).not.toBe(second);
    });
  }
);
