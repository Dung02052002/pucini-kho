import { desc } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { getDb } from "../../../src/db/client";
import * as schema from "../../../src/db/schema";
import { AUDIT_ACTIONS } from "../../../src/modules/audit/audit.actions";
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

  it("succeeds without a session (idempotent)", async () => {
    const res = await apiRequest(app, LOGOUT_PATH, { method: "POST" });

    expect(res.status).toBe(200);
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
