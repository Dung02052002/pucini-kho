import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { getConfig } from "../../config";
import type { AppEnv } from "../../env";
import { CSRF_HEADER_NAME } from "../../shared/constants";

/**
 * Configures CORS based on environment variables
 * Chỉ phản hồi Access-Control-Allow-Origin cho origin nằm trong whitelist CORS_ORIGINS.
 * Origin lạ → không gửi header → trình duyệt chặn đọc response (kể cả khi có cookie).
 */
export function corsMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const allowedOrigins = getConfig(c.env).CORS_ORIGINS;

    const handler = cors({
      origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        CSRF_HEADER_NAME,
      ],
      exposeHeaders: ["X-Request-Id"],
      credentials: true,
      maxAge: 86400,
    });

    return handler(c, next);
  };
}
