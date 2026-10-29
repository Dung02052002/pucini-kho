import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { ERROR_CODES } from "../../src/shared/constants";
import { apiRequest, parseJson } from "../helpers/http";

describe("CSRF protection (global)", () => {
  const app = createApp();

  it("blocks mutating requests missing the X-Requested-With: kqr header", async () => {
    const res = await apiRequest(app, "/api/v1/auth/login", {
      method: "POST",
      body: { username: "admin", pin: "whatever" },
      csrf: false,
    });

    expect(res.status).toBe(403);
    expect((await parseJson(res)).error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("blocks mutating requests with a wrong header value", async () => {
    const res = await apiRequest(app, "/api/v1/auth/logout", {
      method: "POST",
      csrf: false,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    expect(res.status).toBe(403);
  });

  it("lets mutating requests with a valid header reach the route", async () => {
    const res = await apiRequest(app, "/api/v1/auth/logout", {
      method: "POST",
    });

    expect(res.status).toBe(200);
  });

  it("does not require the header for safe methods (GET)", async () => {
    const res = await apiRequest(app, "/api/v1/health", { csrf: false });

    expect(res.status).toBe(200);
  });
});
