import { desc } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { getDb } from "../../../src/db/client";
import * as schema from "../../../src/db/schema";
import { AUDIT_ACTIONS } from "../../../src/modules/audit/audit.actions";
import { ERROR_CODES } from "../../../src/shared/constants";
import {
  apiRequest,
  loginAndGetCookie,
  parseJson,
  testEnv,
} from "../../helpers/http";
import { setupTestDatabase, TEST_PIN_ADMIN } from "../../helpers/test-db";

const LOGOUT_PATH = "/api/v1/auth/logout";

describe("POST /api/v1/auth/logout", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  it("deletes the session, clears the cookie and writes an audit entry", async () => {
    const cookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);

    const logoutRes = await apiRequest(app, LOGOUT_PATH, {
      method: "POST",
      cookie,
    });

    expect(logoutRes.status).toBe(200);
    expect((await parseJson(logoutRes)).data.success).toBe(true);
    expect(logoutRes.headers.get("Set-Cookie")).toContain("Max-Age=0");

    // Session cũ không còn dùng được
    const meRes = await apiRequest(app, "/api/v1/auth/me", { cookie });
    expect(meRes.status).toBe(401);

    const [entry] = await getDb(testEnv)
      .select()
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.id))
      .limit(1);
    expect(entry.action).toBe(AUDIT_ACTIONS.AUTH_LOGOUT);
  });

  it("returns 401 without a session (requires login)", async () => {
    const res = await apiRequest(app, LOGOUT_PATH, { method: "POST" });

    expect(res.status).toBe(401);
    expect((await parseJson(res)).error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns 401 when reusing a session that was already logged out", async () => {
    const cookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);
    await apiRequest(app, LOGOUT_PATH, { method: "POST", cookie });

    const res = await apiRequest(app, LOGOUT_PATH, { method: "POST", cookie });

    expect(res.status).toBe(401);
  });

  it("only revokes the current session, other devices stay logged in", async () => {
    const phoneCookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);
    const laptopCookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);

    await apiRequest(app, LOGOUT_PATH, { method: "POST", cookie: phoneCookie });

    const laptopMe = await apiRequest(app, "/api/v1/auth/me", {
      cookie: laptopCookie,
    });
    expect(laptopMe.status).toBe(200);
  });

  it("rejects logout without the CSRF header", async () => {
    const cookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);

    const res = await apiRequest(app, LOGOUT_PATH, {
      method: "POST",
      cookie,
      csrf: false,
    });

    expect(res.status).toBe(403);
  });
});
