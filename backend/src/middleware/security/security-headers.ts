import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";

/**
 * Security headers middleware
 * Adds critical security headers and camera permissions policy required for barcode/QR scanning
 */
export const securityHeadersMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(self)");
};
