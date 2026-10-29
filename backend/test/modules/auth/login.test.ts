import { desc, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { getDb } from "../../../src/db/client";
import * as schema from "../../../src/db/schema";
import { hashSessionToken } from "../../../src/lib/crypto";
import { addMinutes } from "../../../src/lib/time";
import { AUDIT_ACTIONS } from "../../../src/modules/audit/audit.actions";
import { INVALID_CREDENTIALS_MESSAGE } from "../../../src/modules/auth/auth.policy";
import { ERROR_CODES } from "../../../src/shared/constants";
import { apiRequest, parseJson, testEnv } from "../../helpers/http";
import {
  createStaffUser,
  setupTestDatabase,
  TEST_PIN_ADMIN,
  TEST_PIN_STAFF,
} from "../../helpers/test-db";

const LOGIN_PATH = "/api/v1/auth/login";

describe("POST /api/v1/auth/login", () => {
  const app = createApp();
  const db = getDb(testEnv);

  const login = (body: unknown) =>
    apiRequest(app, LOGIN_PATH, { method: "POST", body });

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  describe("successful login", () => {
    it("logs in with valid staff credentials and sets a secure session cookie", async () => {
      const res = await login({
        username: "nhanvien1",
        pin: TEST_PIN_STAFF,
        remember: false,
      });

      expect(res.status).toBe(200);
      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toContain("kqr_sid=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Lax");

      const body = await parseJson(res);
      expect(body.data.user.username).toBe("nhanvien1");
      expect(body.data.user.role).toBe("STAFF");
      expect(body.data.user.permissions).toEqual(
        expect.arrayContaining(["PICK", "RETURN", "REFILL"]),
      );
      expect(body.data.expiresAt).toBeTruthy();
      // Token chỉ nằm trong cookie, không bao giờ trả về trong body
      expect(JSON.stringify(body)).not.toContain(
        setCookie?.split(";")[0].split("=")[1],
      );
    });

    it("sets a 30-day session when remember=true", async () => {
      const res = await login({
        username: "admin",
        pin: TEST_PIN_ADMIN,
        remember: true,
      });

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.data.user.role).toBe("ADMIN");

      const daysDiff =
        (new Date(body.data.expiresAt).getTime() - Date.now()) / 86_400_000;
      expect(daysDiff).toBeGreaterThan(28);
    });

    it("stores only the SHA-256 hash of the session token in the database", async () => {
      const res = await login({ username: "admin", pin: TEST_PIN_ADMIN });
      const token = res.headers.get("Set-Cookie")?.split(";")[0].split("=")[1];
      if (!token) throw new Error("Cookie missing");

      const [byRawToken] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, token));
      const [byHash] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, await hashSessionToken(token)));

      expect(byRawToken).toBeUndefined();
      expect(byHash).toBeDefined();
    });

    it("writes an AUTH_LOGIN_SUCCESS audit entry", async () => {
      await login({ username: "nhanvien1", pin: TEST_PIN_STAFF });

      const [entry] = await db
        .select()
        .from(schema.auditLog)
        .orderBy(desc(schema.auditLog.id))
        .limit(1);
      expect(entry.action).toBe(AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS);
      expect(entry.userId).toBe(2);
      // Audit không bao giờ chứa PIN
      expect(entry.payloadJson).not.toContain(TEST_PIN_STAFF);
    });
  });

  describe("validation", () => {
    it("returns 422 with details when payload fails validation", async () => {
      const res = await login({ username: "", pin: "12" });

      expect(res.status).toBe(422);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.error.details.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects oversized username and PIN", async () => {
      const res = await login({
        username: "a".repeat(65),
        pin: "1".repeat(129),
      });

      expect(res.status).toBe(422);
      const body = await parseJson(res);
      const fields = body.error.details.map((d: { field: string }) => d.field);
      expect(fields).toEqual(expect.arrayContaining(["username", "pin"]));
    });
  });

  describe("failed login does not reveal whether the username exists", () => {
    it("returns the same 401 message for unknown user, inactive user and wrong PIN", async () => {
      await createStaffUser(testEnv, { id: 100, username: "enum_check" });

      const responses = await Promise.all([
        login({ username: "non_existent_user", pin: "123456" }),
        login({ username: "inactive_user", pin: TEST_PIN_STAFF }),
        login({ username: "enum_check", pin: "wrong_pin" }),
      ]);

      for (const res of responses) {
        expect(res.status).toBe(401);
        const body = await parseJson(res);
        expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
        expect(body.error.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      }
    });
  });

  describe("account lockout", () => {
    it("returns 401 for wrong PIN and locks the account on the 5th consecutive failure", async () => {
      await createStaffUser(testEnv, { id: 101, username: "lock_seq" });

      for (let i = 1; i <= 4; i++) {
        const res = await login({ username: "lock_seq", pin: "wrong_pin" });
        expect(res.status).toBe(401);
      }

      const lockRes = await login({ username: "lock_seq", pin: "wrong_pin" });
      expect(lockRes.status).toBe(423);
      const lockBody = await parseJson(lockRes);
      expect(lockBody.error.code).toBe(ERROR_CODES.ACCOUNT_LOCKED);

      const [auditEntry] = await db
        .select()
        .from(schema.auditLog)
        .where(eq(schema.auditLog.action, AUDIT_ACTIONS.AUTH_ACCOUNT_LOCKED))
        .orderBy(desc(schema.auditLog.id))
        .limit(1);
      expect(auditEntry.userId).toBe(101);

      // Kể cả PIN đúng cũng bị chặn khi đang khóa
      const correctRes = await login({
        username: "lock_seq",
        pin: TEST_PIN_STAFF,
      });
      expect(correctRes.status).toBe(423);
    });

    it("returns 423 for an already locked account", async () => {
      const res = await login({ username: "locked_user", pin: TEST_PIN_STAFF });

      expect(res.status).toBe(423);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.ACCOUNT_LOCKED);
    });

    it("bounds parallel brute-force attempts to the lockout threshold", async () => {
      await createStaffUser(testEnv, { id: 102, username: "lock_parallel" });

      const responses = await Promise.all(
        Array.from({ length: 12 }, () =>
          login({ username: "lock_parallel", pin: "wrong_pin" }),
        ),
      );
      const statuses = responses.map((r) => r.status);

      // Chỉ tối đa 5 lượt được kiểm tra PIN (4 lần 401 + 1 lần 423 khóa), còn lại đều 423
      expect(statuses.filter((s) => s === 401).length).toBeLessThanOrEqual(4);
      expect(statuses.every((s) => s === 401 || s === 423)).toBe(true);

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "lock_parallel"));
      expect(user.failedAttempts).toBe(5);
      expect(user.lockedUntil).not.toBeNull();
    });

    it("restarts the failure counter after a previous lock has expired", async () => {
      await createStaffUser(testEnv, {
        id: 103,
        username: "lock_expired",
        failedAttempts: 5,
        lockedUntil: addMinutes(-1),
      });

      const res = await login({ username: "lock_expired", pin: "wrong_pin" });
      expect(res.status).toBe(401);

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "lock_expired"));
      expect(user.failedAttempts).toBe(1);
      expect(user.lockedUntil).toBeNull();
    });

    it("resets the failure counter after a successful login", async () => {
      await createStaffUser(testEnv, { id: 104, username: "lock_reset" });

      await login({ username: "lock_reset", pin: "wrong_pin" });
      await login({ username: "lock_reset", pin: "wrong_pin" });
      const okRes = await login({
        username: "lock_reset",
        pin: TEST_PIN_STAFF,
      });
      expect(okRes.status).toBe(200);

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "lock_reset"));
      expect(user.failedAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });
  });
});
