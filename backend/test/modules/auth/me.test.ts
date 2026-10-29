import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { generateSessionToken } from "../../../src/lib/crypto";
import { ERROR_CODES } from "../../../src/shared/constants";
import {
  apiRequest,
  loginAndGetCookie,
  parseJson,
  testEnv,
} from "../../helpers/http";
import { setupTestDatabase, TEST_PIN_ADMIN } from "../../helpers/test-db";

const ME_PATH = "/api/v1/auth/me";

describe("GET /api/v1/auth/me", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  it("returns 401 when accessed without authentication", async () => {
    const res = await apiRequest(app, ME_PATH);

    expect(res.status).toBe(401);
    const body = await parseJson(res);
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns 200 with user profile when accessed with a valid session cookie", async () => {
    const cookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);

    const res = await apiRequest(app, ME_PATH, { cookie });

    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body.data.user.username).toBe("admin");
    expect(body.data.user.role).toBe("ADMIN");
    expect(body.data.openBatch).toBeNull();
    expect(body.data.openTaskCount).toBe(0);
  });

  it("accepts the session token via Authorization: Bearer", async () => {
    const cookie = await loginAndGetCookie(app, "admin", TEST_PIN_ADMIN);
    const token = cookie.split("=")[1];

    const res = await apiRequest(app, ME_PATH, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });

  it("returns 401 for a well-formed but unknown token and for malformed tokens", async () => {
    const unknown = await apiRequest(app, ME_PATH, {
      cookie: `kqr_sid=${generateSessionToken()}`,
    });
    const malformed = await apiRequest(app, ME_PATH, {
      cookie: "kqr_sid=' OR 1=1 --",
    });

    expect(unknown.status).toBe(401);
    expect(malformed.status).toBe(401);
  });
});
