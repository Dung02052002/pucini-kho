import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { isPublicRoute } from "../../src/middleware/auth/access-policy";
import { ERROR_CODES } from "../../src/shared/constants";
import {
  apiRequest,
  loginAndGetCookie,
  parseJson,
  testEnv,
} from "../helpers/http";
import { setupTestDatabase, TEST_PIN_STAFF } from "../helpers/test-db";

describe("Deny-by-default access policy", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  describe("isPublicRoute", () => {
    it("matches only whitelisted method + path pairs", () => {
      expect(isPublicRoute("GET", "/api/v1/health")).toBe(true);
      expect(isPublicRoute("GET", "/api/v1/health/")).toBe(true);
      expect(isPublicRoute("post", "/api/v1/auth/login")).toBe(true);

      expect(isPublicRoute("GET", "/api/v1/auth/login")).toBe(false);
      expect(isPublicRoute("GET", "/api/v1/auth/me")).toBe(false);
      expect(isPublicRoute("DELETE", "/api/v1/health")).toBe(false);
    });
  });

  it("returns 401 (not 404) for unknown routes when anonymous, hiding which endpoints exist", async () => {
    const res = await apiRequest(app, "/api/v1/non-existent-route");

    expect(res.status).toBe(401);
    expect((await parseJson(res)).error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns 404 with standard error format for unknown routes when authenticated", async () => {
    const cookie = await loginAndGetCookie(app, "nhanvien1", TEST_PIN_STAFF);

    const res = await apiRequest(app, "/api/v1/non-existent-route", { cookie });

    expect(res.status).toBe(404);
    const requestId = res.headers.get("X-Request-Id");
    expect(await res.json()).toEqual({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: expect.any(String),
        requestId,
      },
    });
  });

  it("lets CORS preflight (OPTIONS) through without a session", async () => {
    const res = await apiRequest(app, "/api/v1/auth/me", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(res.status).toBe(204);
  });
});
