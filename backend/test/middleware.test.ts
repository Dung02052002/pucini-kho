import { env } from "cloudflare:test";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { AppEnv, Bindings } from "../src/env";
import {
  authMiddleware,
  csrfProtection,
  requireAuth,
  requirePerm,
  requireRole,
} from "../src/middleware/auth";
import { dbMiddleware } from "../src/middleware/db";
import { errorHandler } from "../src/middleware/error-handler";
import { requestIdMiddleware } from "../src/middleware/request-id";
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

describe("Auth Guards & CSRF Middleware Tests", () => {
  const bindings = env as unknown as Bindings;

  // Build a test router with guarded endpoints
  const testApp = new Hono<AppEnv>();
  testApp.use("*", requestIdMiddleware);
  testApp.use("*", dbMiddleware);
  testApp.use("*", authMiddleware);
  testApp.onError(errorHandler);

  // Admin-only route
  testApp.get("/admin-only", requireRole("ADMIN"), (c) => {
    return c.json({ data: "ok-admin" });
  });

  // Permission-guarded routes
  testApp.get("/refill-only", requirePerm("REFILL"), (c) => {
    return c.json({ data: "ok-refill" });
  });

  testApp.get("/count-only", requirePerm("COUNT"), (c) => {
    return c.json({ data: "ok-count" });
  });

  // CSRF-protected mutating route
  testApp.post("/csrf-test", requireAuth, csrfProtection, (c) => {
    return c.json({ data: "ok-csrf" });
  });

  let adminCookie = "";
  let staff1Cookie = ""; // has PICK, RETURN, REFILL
  let staff2Cookie = ""; // has PICK, RETURN, COUNT

  beforeAll(async () => {
    await setupTestDatabase(bindings);

    const realApp = createApp();

    const adminRes = await realApp.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", pin: TEST_PIN_ADMIN }),
      },
      env,
    );
    const aCookie = adminRes.headers.get("Set-Cookie");
    if (!aCookie) throw new Error("Admin cookie missing");
    adminCookie = aCookie;

    const s1Res = await realApp.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "nhanvien1", pin: TEST_PIN_STAFF }),
      },
      env,
    );
    const s1Cookie = s1Res.headers.get("Set-Cookie");
    if (!s1Cookie) throw new Error("Staff1 cookie missing");
    staff1Cookie = s1Cookie;

    const s2Res = await realApp.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "nhanvien2", pin: TEST_PIN_STAFF }),
      },
      env,
    );
    const s2Cookie = s2Res.headers.get("Set-Cookie");
    if (!s2Cookie) throw new Error("Staff2 cookie missing");
    staff2Cookie = s2Cookie;
  });

  describe("requireRole", () => {
    it("allows ADMIN access to admin-only route", async () => {
      const res = await testApp.request(
        "/admin-only",
        {
          headers: { Cookie: adminCookie },
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await parseJson(res);
      expect(json.data).toBe("ok-admin");
    });

    it("forbids STAFF access to admin-only route with 403 PERMISSION_DENIED", async () => {
      const res = await testApp.request(
        "/admin-only",
        {
          headers: { Cookie: staff1Cookie },
        },
        env,
      );
      expect(res.status).toBe(403);
      const json = await parseJson(res);
      expect(json.error.code).toBe(ERROR_CODES.PERMISSION_DENIED);
    });
  });

  describe("requirePerm", () => {
    it("allows ADMIN to access any permission-protected route", async () => {
      const res = await testApp.request(
        "/refill-only",
        {
          headers: { Cookie: adminCookie },
        },
        env,
      );
      expect(res.status).toBe(200);
    });

    it("allows staff with REFILL to access refill route, but forbids count route", async () => {
      // staff1 has REFILL
      const refillRes = await testApp.request(
        "/refill-only",
        {
          headers: { Cookie: staff1Cookie },
        },
        env,
      );
      expect(refillRes.status).toBe(200);

      // staff1 does NOT have COUNT
      const countRes = await testApp.request(
        "/count-only",
        {
          headers: { Cookie: staff1Cookie },
        },
        env,
      );
      expect(countRes.status).toBe(403);
      const json = await parseJson(countRes);
      expect(json.error.code).toBe(ERROR_CODES.PERMISSION_DENIED);
      expect(json.error.details.perm).toBe("COUNT");
    });

    it("allows staff with COUNT to access count route, but forbids refill route", async () => {
      // staff2 has COUNT
      const countRes = await testApp.request(
        "/count-only",
        {
          headers: { Cookie: staff2Cookie },
        },
        env,
      );
      expect(countRes.status).toBe(200);

      // staff2 does NOT have REFILL
      const refillRes = await testApp.request(
        "/refill-only",
        {
          headers: { Cookie: staff2Cookie },
        },
        env,
      );
      expect(refillRes.status).toBe(403);
    });
  });

  describe("csrfProtection", () => {
    it("blocks mutating requests missing X-Requested-With: kqr header", async () => {
      const res = await testApp.request(
        "/csrf-test",
        {
          method: "POST",
          headers: {
            Cookie: adminCookie,
          },
        },
        env,
      );
      expect(res.status).toBe(403);
      const json = await parseJson(res);
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it("allows mutating requests with valid X-Requested-With: kqr header", async () => {
      const res = await testApp.request(
        "/csrf-test",
        {
          method: "POST",
          headers: {
            Cookie: adminCookie,
            "X-Requested-With": "kqr",
          },
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await parseJson(res);
      expect(json.data).toBe("ok-csrf");
    });
  });
});
