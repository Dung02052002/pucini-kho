import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { Bindings } from "../src/env";
import { ERROR_CODES } from "../src/shared/constants";
import {
  setupTestDatabase,
  TEST_PIN_ADMIN,
  TEST_PIN_STAFF,
} from "./helpers/test-db";

// Helper to parse JSON without TS unknown warnings
// biome-ignore lint/suspicious/noExplicitAny: test helper
async function parseJson<T = any>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe("Auth Module Integration Tests", () => {
  const bindings = env as unknown as Bindings;
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase(bindings);
  });

  describe("POST /api/v1/auth/login", () => {
    it("successfully logs in with valid staff credentials and sets session cookie", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "nhanvien1",
            pin: TEST_PIN_STAFF,
            remember: false,
          }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("kqr_sid=");
      expect(setCookie).toContain("HttpOnly");

      const body = await parseJson(res);
      expect(body.data.user.username).toBe("nhanvien1");
      expect(body.data.user.role).toBe("STAFF");
      expect(body.data.user.permissions).toContain("PICK");
      expect(body.data.user.permissions).toContain("RETURN");
      expect(body.data.user.permissions).toContain("REFILL");
      expect(body.data.expiresAt).toBeTruthy();
    });

    it("successfully logs in with remember=true and sets 30-day session", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "admin",
            pin: TEST_PIN_ADMIN,
            remember: true,
          }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.data.user.username).toBe("admin");
      expect(body.data.user.role).toBe("ADMIN");

      // Check that expiresAt is ~30 days in the future
      const expiresAt = new Date(body.data.expiresAt).getTime();
      const now = Date.now();
      const daysDiff = (expiresAt - now) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(28);
    });

    it("returns 422 with details when payload fails validation", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "",
            pin: "12", // min 4 chars
          }),
        },
        env,
      );

      expect(res.status).toBe(422);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 401 when username does not exist", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "non_existent_user",
            pin: "123456",
          }),
        },
        env,
      );

      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 for wrong PIN and locks account after 5 consecutive failures", async () => {
      // 4 wrong attempts
      for (let i = 1; i <= 4; i++) {
        const res = await app.request(
          "/api/v1/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: "nhanvien2",
              pin: "wrong_pin",
            }),
          },
          env,
        );

        expect(res.status).toBe(401);
        const body = await parseJson(res);
        expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      }

      // 5th wrong attempt -> account gets locked
      const lockRes = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "nhanvien2",
            pin: "wrong_pin",
          }),
        },
        env,
      );

      expect(lockRes.status).toBe(423);
      const lockBody = await parseJson(lockRes);
      expect(lockBody.error.code).toBe(ERROR_CODES.ACCOUNT_LOCKED);
    });

    it("returns 423 when trying to log in to an already locked account", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "locked_user",
            pin: TEST_PIN_STAFF,
          }),
        },
        env,
      );

      expect(res.status).toBe(423);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.ACCOUNT_LOCKED);
    });

    it("returns 401 when trying to log in to an inactive account", async () => {
      const res = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "inactive_user",
            pin: TEST_PIN_STAFF,
          }),
        },
        env,
      );

      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns 401 when accessed without authentication", async () => {
      const res = await app.request("/api/v1/auth/me", {}, env);
      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 200 with user profile when accessed with valid session cookie", async () => {
      // 1. Log in first
      const loginRes = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "admin",
            pin: TEST_PIN_ADMIN,
          }),
        },
        env,
      );

      const cookie = loginRes.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      if (!cookie) throw new Error("Cookie missing");

      // 2. Request /me with cookie
      const meRes = await app.request(
        "/api/v1/auth/me",
        {
          headers: {
            Cookie: cookie,
          },
        },
        env,
      );

      expect(meRes.status).toBe(200);
      const meBody = await parseJson(meRes);
      expect(meBody.data.user.username).toBe("admin");
      expect(meBody.data.user.role).toBe("ADMIN");
      expect(meBody.data.openBatch).toBeNull();
      expect(typeof meBody.data.openTaskCount).toBe("number");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out and clears session cookie", async () => {
      // 1. Login
      const loginRes = await app.request(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "admin",
            pin: TEST_PIN_ADMIN,
          }),
        },
        env,
      );

      const cookie = loginRes.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      if (!cookie) throw new Error("Cookie missing");

      // 2. Logout
      const logoutRes = await app.request(
        "/api/v1/auth/logout",
        {
          method: "POST",
          headers: {
            Cookie: cookie,
          },
        },
        env,
      );

      expect(logoutRes.status).toBe(200);
      const logoutBody = await parseJson(logoutRes);
      expect(logoutBody.data.success).toBe(true);

      // 3. /me should now fail with 401
      const meRes = await app.request(
        "/api/v1/auth/me",
        {
          headers: {
            Cookie: cookie,
          },
        },
        env,
      );

      expect(meRes.status).toBe(401);
    });
  });
});
