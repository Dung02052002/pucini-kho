import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { ERROR_CODES } from "../../src/shared/constants";
import { apiRequest, parseJson, testEnv } from "../helpers/http";
import { setupTestDatabase, TEST_PIN_STAFF } from "../helpers/test-db";

/**
 * Limiter giả: cho phép `allowed` request đầu tiên, sau đó từ chối.
 * Ghi lại các key để kiểm tra đếm theo IP.
 */
function fakeLimiter(allowed: number) {
  const keys: string[] = [];
  const limiter: RateLimit = {
    limit: async ({ key }) => {
      keys.push(key);
      return { success: keys.length <= allowed };
    },
  };
  return { limiter, keys };
}

describe("Login rate limit", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase(testEnv);
  });

  it("returns 429 once the limiter rejects, keyed by client IP", async () => {
    const { limiter, keys } = fakeLimiter(1);
    const env = { ...testEnv, LOGIN_RATE_LIMITER: limiter };
    const login = () =>
      apiRequest(app, "/api/v1/auth/login", {
        method: "POST",
        body: { username: "nhanvien1", pin: TEST_PIN_STAFF },
        headers: { "cf-connecting-ip": "203.0.113.7" },
        env,
      });

    expect((await login()).status).toBe(200);

    const blocked = await login();
    expect(blocked.status).toBe(429);
    expect((await parseJson(blocked)).error.code).toBe(
      ERROR_CODES.RATE_LIMITED,
    );
    expect(keys).toEqual(["login:203.0.113.7", "login:203.0.113.7"]);
  });
});
