import { describe, expect, it } from "vitest";
import { createApp } from "../../../src/app";
import { apiRequest } from "../../helpers/http";

describe("GET /api/v1/health", () => {
  const app = createApp();

  it("is public and returns 200 with ok status and X-Request-Id header", async () => {
    const res = await apiRequest(app, "/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
    expect(await res.json()).toEqual({
      data: { status: "ok", version: "1.0.0", db: "ok" },
    });
  });
});
