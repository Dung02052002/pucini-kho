import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { ERROR_CODES } from "../../../src/shared/constants";
import { apiRequest, parseJson, testEnv } from "../../helpers/http";
import {
  setupTestDatabase,
  TEST_PIN_ADMIN,
  TEST_PIN_STAFF,
} from "../../helpers/test-db";

const LOGIN_PATH = "/api/v1/auth/login";

describe("POST /api/v1/auth/login", () => {
  const app = createApp();

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
  });

  describe("validation", () => {
    it("returns 422 with details when payload fails validation", async () => {
      const res = await login({ username: "", pin: "12" });

      expect(res.status).toBe(422);
      const body = await parseJson(res);
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.error.details.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("failed login", () => {
    it("returns 401 when username does not exist", async () => {
      const res = await login({ username: "non_existent_user", pin: "123456" });

      expect(res.status).toBe(401);
      expect((await parseJson(res)).error.code).toBe(
        ERROR_CODES.UNAUTHENTICATED,
      );
    });

    it("returns 401 for an inactive account", async () => {
      const res = await login({
        username: "inactive_user",
        pin: TEST_PIN_STAFF,
      });

      expect(res.status).toBe(401);
    });
  });

  describe("account lockout", () => {
    it("returns 401 for wrong PIN and locks the account on the 5th consecutive failure", async () => {
      for (let i = 1; i <= 4; i++) {
        const res = await login({ username: "nhanvien2", pin: "wrong_pin" });
        expect(res.status).toBe(401);
      }

      const lockRes = await login({ username: "nhanvien2", pin: "wrong_pin" });
      expect(lockRes.status).toBe(423);
      expect((await parseJson(lockRes)).error.code).toBe(
        ERROR_CODES.ACCOUNT_LOCKED,
      );
    });

    it("returns 423 for an already locked account", async () => {
      const res = await login({ username: "locked_user", pin: TEST_PIN_STAFF });

      expect(res.status).toBe(423);
      expect((await parseJson(res)).error.code).toBe(
        ERROR_CODES.ACCOUNT_LOCKED,
      );
    });
  });
});
