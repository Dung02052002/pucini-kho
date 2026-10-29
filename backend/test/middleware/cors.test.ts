import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { apiRequest, testEnv } from "../helpers/http";

describe("CORS whitelist", () => {
  const app = createApp();

  it("reflects a whitelisted origin with credentials allowed", async () => {
    const res = await apiRequest(app, "/api/v1/health", {
      headers: { Origin: "http://localhost:5173" },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173",
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("does not send Access-Control-Allow-Origin for an unknown origin", async () => {
    const res = await apiRequest(app, "/api/v1/health", {
      headers: { Origin: "https://evil.example" },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("uses the CORS_ORIGINS env variable when provided", async () => {
    const res = await apiRequest(app, "/api/v1/health", {
      headers: { Origin: "https://kho.pucini.vn" },
      env: { ...testEnv, CORS_ORIGINS: "https://kho.pucini.vn" },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://kho.pucini.vn",
    );
  });
});
