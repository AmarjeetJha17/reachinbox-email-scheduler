import {
  describe,
  expect,
  it
} from "vitest";

import {
  scheduleCampaignSchema
} from "./campaign.types";

function futureDate() {
  return new Date(
    Date.now() + 60_000
  ).toISOString();
}

describe(
  "scheduleCampaignSchema",
  () => {
    it("accepts a valid campaign", () => {
      const result =
        scheduleCampaignSchema.safeParse({
          senderId:
            "11111111-1111-4111-8111-111111111111",

          subject:
            "Test campaign",

          body:
            "Hello from tests",

          startAt:
            futureDate(),

          delayBetweenEmails:
            2000,

          hourlyLimit:
            20,

          recipients: [
            {
              email:
                "amar@example.com"
            },

            {
              email:
                "rahul@example.com"
            }
          ]
        });

      expect(result.success).toBe(true);
    });

    it("rejects duplicate recipients", () => {
      const result =
        scheduleCampaignSchema.safeParse({
          senderId:
            "11111111-1111-4111-8111-111111111111",

          subject:
            "Test campaign",

          body:
            "Hello",

          startAt:
            futureDate(),

          delayBetweenEmails:
            2000,

          hourlyLimit:
            20,

          recipients: [
            {
              email:
                "amar@example.com"
            },

            {
              email:
                "AMAR@example.com"
            }
          ]
        });

      expect(result.success).toBe(false);
    });

    it("rejects past start times", () => {
      const result =
        scheduleCampaignSchema.safeParse({
          senderId:
            "11111111-1111-4111-8111-111111111111",

          subject:
            "Test campaign",

          body:
            "Hello",

          startAt:
            new Date(
              Date.now() - 60_000
            ).toISOString(),

          recipients: [
            {
              email:
                "amar@example.com"
            }
          ]
        });

      expect(result.success).toBe(false);
    });

    it("rejects invalid email addresses", () => {
      const result =
        scheduleCampaignSchema.safeParse({
          senderId:
            "11111111-1111-4111-8111-111111111111",

          subject:
            "Test campaign",

          body:
            "Hello",

          startAt:
            futureDate(),

          recipients: [
            {
              email:
                "not-an-email"
            }
          ]
        });

      expect(result.success).toBe(false);
    });
  }
);
