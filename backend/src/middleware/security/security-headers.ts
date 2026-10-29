import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";

/**
 * Security headers middleware
 * Backend chỉ trả JSON nên áp dụng chính sách chặt nhất có thể:
 * - CSP `default-src 'none'`: response không bao giờ được render/thực thi như trang web
 * - HSTS: buộc trình duyệt luôn dùng HTTPS
 * - Cache-Control no-store: không cache dữ liệu người dùng ở trình duyệt/proxy
 * - Permissions-Policy camera=(self): cho phép quét mã QR/barcode trên cùng origin
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
  c.header(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("Cross-Origin-Resource-Policy", "same-site");
  c.header("Cache-Control", "no-store");
};
