import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { getDb } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import type { AppEnv } from "../../src/env";
import { dbMiddleware } from "../../src/middleware/core/db";
import { errorHandler } from "../../src/middleware/core/error-handler";
import {
  getWindowStart,
  rateLimit,
} from "../../src/middleware/security/rate-limit";
import { LOGIN_RATE_LIMIT_MAX_REQUESTS } from "../../src/modules/auth/auth.policy";
import { ERROR_CODES } from "../../src/shared/constants";
import { apiRequest, parseJson, testEnv } from "../helpers/http";
import { setupTestDatabase } from "../helpers/test-db";

describe("Rate limit (D1 fixed window)", () => {
  const db = getDb(testEnv);

  // App thử nghiệm với limit nhỏ để test nhanh
  const testApp = new Hono<AppEnv>();
  testApp.use("*", dbMiddleware);
  testApp.onError(errorHandler);
  testApp.get(
    "/limited",
    rateLimit({ prefix: "test", limit: 2, windowSeconds: 600 }),
    (c) => c.json({ data: "ok" }),
  );

  const callFrom = (ip: string) =>
    apiRequest(testApp, "/limited", { headers: { "cf-connecting-ip": ip } });

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  describe("getWindowStart", () => {
    it("rounds down to the start of the window", () => {
      const at = Date.parse("2026-10-29T10:07:31.000Z");
      expect(getWindowStart(at, 600)).toBe("2026-10-29T10:00:00.000Z");
      expect(getWindowStart(at + 5 * 60_000, 600)).toBe(
        "2026-10-29T10:10:00.000Z",
      );
    });
  });

  it("allows requests up to the limit, then returns 429 with retryAfterSeconds", async () => {
    expect((await callFrom("198.51.100.1")).status).toBe(200);
    expect((await callFrom("198.51.100.1")).status).toBe(200);

    const blocked = await callFrom("198.51.100.1");
    expect(blocked.status).toBe(429);
    const body = await parseJson(blocked);
    expect(body.error.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(body.error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(body.error.details.retryAfterSeconds).toBeLessThanOrEqual(600);
  });

  it("counts each IP separately", async () => {
    await callFrom("198.51.100.2");
    await callFrom("198.51.100.2");
    expect((await callFrom("198.51.100.2")).status).toBe(429);

    expect((await callFrom("198.51.100.3")).status).toBe(200);
  });

  it("resets the counter when a new window starts", async () => {
    await callFrom("198.51.100.4");
    await callFrom("198.51.100.4");
    expect((await callFrom("198.51.100.4")).status).toBe(429);

    // Giả lập cửa sổ cũ đã trôi qua
    await db
      .update(schema.rateLimits)
      .set({ windowStart: "2000-01-01T00:00:00.000Z" })
      .where(eq(schema.rateLimits.key, "test:198.51.100.4"));

    expect((await callFrom("198.51.100.4")).status).toBe(200);
  });

  it("counts concurrent requests atomically", async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => callFrom("198.51.100.5")),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(2);
    expect(statuses.filter((s) => s === 429)).toHaveLength(4);
  });

  describe("POST /api/v1/auth/login", () => {
    it(`blocks the ${LOGIN_RATE_LIMIT_MAX_REQUESTS + 1}th attempt from the same IP within the window`, async () => {
      const app = createApp();
      const login = () =>
        apiRequest(app, "/api/v1/auth/login", {
          method: "POST",
          body: {}, // body sai → 422 nhanh, nhưng vẫn bị đếm vì rate limit chạy trước validate
          headers: { "cf-connecting-ip": "198.51.100.10" },
        });

      for (let i = 0; i < LOGIN_RATE_LIMIT_MAX_REQUESTS; i++) {
        expect((await login()).status).toBe(422);
      }

      const blocked = await login();
      expect(blocked.status).toBe(429);
      expect((await parseJson(blocked)).error.code).toBe(
        ERROR_CODES.RATE_LIMITED,
      );
    });
  });
});
