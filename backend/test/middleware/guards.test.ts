import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import type { AppEnv } from "../../src/env";
import { requirePerm, requireRole } from "../../src/middleware/auth/guards";
import { authMiddleware } from "../../src/middleware/auth/session";
import { dbMiddleware } from "../../src/middleware/core/db";
import { errorHandler } from "../../src/middleware/core/error-handler";
import { requestIdMiddleware } from "../../src/middleware/core/request-id";
import { ERROR_CODES } from "../../src/shared/constants";
import {
  apiRequest,
  loginAndGetCookie,
  parseJson,
  testEnv,
} from "../helpers/http";
import {
  setupTestDatabase,
  TEST_PIN_ADMIN,
  TEST_PIN_STAFF,
} from "../helpers/test-db";

describe("Auth guards (requireRole / requirePerm)", () => {
  // Router thử nghiệm với các endpoint được bảo vệ bằng guard
  const testApp = new Hono<AppEnv>();
  testApp.use("*", requestIdMiddleware);
  testApp.use("*", dbMiddleware);
  testApp.use("*", authMiddleware);
  testApp.onError(errorHandler);
  testApp.get("/admin-only", requireRole("ADMIN"), (c) =>
    c.json({ data: "ok-admin" }),
  );
  testApp.get("/refill-only", requirePerm("REFILL"), (c) =>
    c.json({ data: "ok-refill" }),
  );
  testApp.get("/count-only", requirePerm("COUNT"), (c) =>
    c.json({ data: "ok-count" }),
  );

  let adminCookie = "";
  let staff1Cookie = ""; // has PICK, RETURN, REFILL
  let staff2Cookie = ""; // has PICK, RETURN, COUNT

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
    const realApp = createApp();
    adminCookie = await loginAndGetCookie(realApp, "admin", TEST_PIN_ADMIN);
    staff1Cookie = await loginAndGetCookie(
      realApp,
      "nhanvien1",
      TEST_PIN_STAFF,
    );
    staff2Cookie = await loginAndGetCookie(
      realApp,
      "nhanvien2",
      TEST_PIN_STAFF,
    );
  });

  describe("requireRole", () => {
    it("allows ADMIN access to admin-only route", async () => {
      const res = await apiRequest(testApp, "/admin-only", {
        cookie: adminCookie,
      });
      expect(res.status).toBe(200);
      expect((await parseJson(res)).data).toBe("ok-admin");
    });

    it("forbids STAFF access to admin-only route with 403 PERMISSION_DENIED", async () => {
      const res = await apiRequest(testApp, "/admin-only", {
        cookie: staff1Cookie,
      });
      expect(res.status).toBe(403);
      expect((await parseJson(res)).error.code).toBe(
        ERROR_CODES.PERMISSION_DENIED,
      );
    });
  });

  describe("requirePerm", () => {
    it("allows ADMIN to access any permission-protected route", async () => {
      const res = await apiRequest(testApp, "/refill-only", {
        cookie: adminCookie,
      });
      expect(res.status).toBe(200);
    });

    it("allows staff with REFILL to access refill route, but forbids count route", async () => {
      const refillRes = await apiRequest(testApp, "/refill-only", {
        cookie: staff1Cookie,
      });
      expect(refillRes.status).toBe(200);

      const countRes = await apiRequest(testApp, "/count-only", {
        cookie: staff1Cookie,
      });
      expect(countRes.status).toBe(403);
      const json = await parseJson(countRes);
      expect(json.error.code).toBe(ERROR_CODES.PERMISSION_DENIED);
      expect(json.error.details.perm).toBe("COUNT");
    });

    it("allows staff with COUNT to access count route, but forbids refill route", async () => {
      const countRes = await apiRequest(testApp, "/count-only", {
        cookie: staff2Cookie,
      });
      expect(countRes.status).toBe(200);

      const refillRes = await apiRequest(testApp, "/refill-only", {
        cookie: staff2Cookie,
      });
      expect(refillRes.status).toBe(403);
    });
  });
});
