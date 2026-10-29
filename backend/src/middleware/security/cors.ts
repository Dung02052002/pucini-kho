import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { getConfig } from "../../config";
import type { AppEnv } from "../../env";

/**
 * Configures CORS based on environment variables
 * Supports dev frontend origins and production origins with credentials
 */
export function corsMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const config = getConfig(c.env);
    const origins = config.CORS_ORIGINS.split(",").map((o) => o.trim());

    const handler = cors({
      origin: (origin) => {
        if (!origin) return origins[0];
        if (origins.includes(origin) || origins.includes("*")) {
          return origin;
        }
        return origins[0];
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-Requested-With",
      ],
      exposeHeaders: ["X-Request-Id"],
      credentials: true,
      maxAge: 86400,
    });

    return handler(c, next);
  };
}
