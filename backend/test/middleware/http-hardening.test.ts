import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { DEFAULT_MAX_BODY_BYTES } from "../../src/middleware/security/body-limit";
import { ERROR_CODES } from "../../src/shared/constants";
import { apiRequest, parseJson } from "../helpers/http";

/**
 * Các middleware tầng HTTP: security headers, request id, body limit.
 */
describe("HTTP hardening middleware", () => {
  const app = createApp();

  describe("security headers", () => {
    it("sets strict headers on every response, including errors", async () => {
      const ok = await apiRequest(app, "/api/v1/health");
      const error = await apiRequest(app, "/api/v1/auth/me");

      for (const res of [ok, error]) {
        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(res.headers.get("X-Frame-Options")).toBe("DENY");
        expect(res.headers.get("Content-Security-Policy")).toContain(
          "default-src 'none'",
        );
        expect(res.headers.get("Strict-Transport-Security")).toContain(
          "max-age=",
        );
        expect(res.headers.get("Cache-Control")).toBe("no-store");
      }
    });
  });

  describe("request id", () => {
    it("keeps a safe client-provided X-Request-Id", async () => {
      const res = await apiRequest(app, "/api/v1/health", {
        headers: { "X-Request-Id": "client-trace_123" },
      });

      expect(res.headers.get("X-Request-Id")).toBe("client-trace_123");
    });

    it("replaces unsafe or oversized X-Request-Id values", async () => {
      const unsafe = await apiRequest(app, "/api/v1/health", {
        headers: { "X-Request-Id": 'abc"}{injected' },
      });
      const oversized = await apiRequest(app, "/api/v1/health", {
        headers: { "X-Request-Id": "a".repeat(65) },
      });

      expect(unsafe.headers.get("X-Request-Id")).not.toContain("injected");
      expect(oversized.headers.get("X-Request-Id")).toHaveLength(36); // UUID
    });
  });

  describe("body limit", () => {
    it("rejects bodies larger than the default limit with 413", async () => {
      const res = await apiRequest(app, "/api/v1/auth/login", {
        method: "POST",
        body: {
          username: "admin",
          pin: "x".repeat(DEFAULT_MAX_BODY_BYTES + 1),
        },
      });

      expect(res.status).toBe(413);
      expect((await parseJson(res)).error.code).toBe(
        ERROR_CODES.PAYLOAD_TOO_LARGE,
      );
    });
  });
});
