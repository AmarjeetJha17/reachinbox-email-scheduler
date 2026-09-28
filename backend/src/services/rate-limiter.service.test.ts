import {
  describe,
  expect,
  it,
  beforeEach
} from "vitest";

import {
  reserveSendSlot
} from "./rate-limiter.service";

import {
  redisConnection
} from "../config/redis";

describe(
  "distributed rate limiter",
  () => {
    const senderId =
      "test-rate-limiter";

    beforeEach(
      async () => {
        const keys =
          await redisConnection.keys(
            `email:rate:${senderId}:*`
          );

        if (keys.length > 0) {
          await redisConnection.del(
            ...keys
          );
        }

        await redisConnection.del(
          `email:spacing:${senderId}`
        );
      }
    );

    it(
      "allows requests up to the hourly limit",
      async () => {
        const now =
          Date.now();

        const first =
          await reserveSendSlot({
            senderId,

            maxEmailsPerHour:
              2,

            minDelayMs:
              0,

            nowMs:
              now
          });

        const second =
          await reserveSendSlot({
            senderId,

            maxEmailsPerHour:
              2,

            minDelayMs:
              0,

            nowMs:
              now
          });

        const third =
          await reserveSendSlot({
            senderId,

            maxEmailsPerHour:
              2,

            minDelayMs:
              0,

            nowMs:
              now
          });

        expect(
          first.allowed
        ).toBe(true);

        expect(
          second.allowed
        ).toBe(true);

        expect(
          third.allowed
        ).toBe(false);

        expect(
          third.reason
        ).toBe(
          "hourly_limit"
        );
      }
    );

    it(
      "enforces minimum spacing",
      async () => {
        const firstTime =
          Date.now();

        const first =
          await reserveSendSlot({
            senderId,

            maxEmailsPerHour:
              100,

            minDelayMs:
              5000,

            nowMs:
              firstTime
          });

        const second =
          await reserveSendSlot({
            senderId,

            maxEmailsPerHour:
              100,

            minDelayMs:
              5000,

            nowMs:
              firstTime + 1000
          });

        expect(
          first.allowed
        ).toBe(true);

        expect(
          second.allowed
        ).toBe(false);

        expect(
          second.reason
        ).toBe(
          "minimum_delay"
        );
      }
    );
  }
);
