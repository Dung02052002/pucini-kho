import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { ERROR_CODES, ERROR_MESSAGES } from "../src/shared/constants";

describe("PUCINI Kho Backend Foundation", () => {
  const app = createApp();

  describe("GET /api/v1/health", () => {
    it("returns 200 with ok status and X-Request-Id header", async () => {
      const res = await app.request("/api/v1/health", {}, env);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Request-Id")).toBeTruthy();

      const json = await res.json();
      expect(json).toEqual({
        data: {
          status: "ok",
          version: "1.0.0",
          db: "ok",
        },
      });
    });
  });

  describe("Unknown routes", () => {
    it("returns 404 with standard error format and X-Request-Id header", async () => {
      const res = await app.request("/api/v1/non-existent-route", {}, env);

      expect(res.status).toBe(404);
      const requestId = res.headers.get("X-Request-Id");
      expect(requestId).toBeTruthy();

      const json = await res.json();
      expect(json).toEqual({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.NOT_FOUND,
          requestId,
        },
      });
    });
  });
});
