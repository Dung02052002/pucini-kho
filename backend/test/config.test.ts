import { describe, expect, it } from "vitest";
import { getConfig } from "../src/config";
import type { Bindings } from "../src/env";

const baseEnv = {} as Bindings;

describe("getConfig", () => {
  it("falls back to localhost CORS origins in development", () => {
    const config = getConfig(baseEnv);

    expect(config.CORS_ORIGINS).toContain("http://localhost:5173");
  });

  it("parses a comma-separated CORS_ORIGINS list", () => {
    const config = getConfig({
      ...baseEnv,
      CORS_ORIGINS: "https://a.example, https://b.example:8443",
    });

    expect(config.CORS_ORIGINS).toEqual([
      "https://a.example",
      "https://b.example:8443",
    ]);
  });

  it("rejects wildcard and malformed origins", () => {
    expect(() => getConfig({ ...baseEnv, CORS_ORIGINS: "*" })).toThrow();
    expect(() =>
      getConfig({ ...baseEnv, CORS_ORIGINS: "https://a.example/path" }),
    ).toThrow();
  });

  it("requires CORS_ORIGINS in production", () => {
    expect(() => getConfig({ ...baseEnv, ENVIRONMENT: "production" })).toThrow(
      /CORS_ORIGINS/,
    );
    expect(() =>
      getConfig({
        ...baseEnv,
        ENVIRONMENT: "production",
        CORS_ORIGINS: "https://kho.ql.vn",
      }),
    ).not.toThrow();
  });
});
