import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";
import { ForbiddenError } from "../../lib/errors";
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from "../../shared/constants";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Các endpoint ghi dữ liệu KHÔNG yêu cầu header CSRF vì không được gọi từ trình duyệt
 * (ví dụ webhook KiotViet — sẽ được bảo vệ bằng chữ ký HMAC thay thế).
 * Thêm path đầy đủ, ví dụ: `${API_PREFIX}/webhooks/kiotviet`.
 */
const CSRF_EXEMPT_PATHS: ReadonlySet<string> = new Set<string>([]);

/**
 * CSRF Protection middleware for mutating state (POST, PUT, PATCH, DELETE)
 * Verifies X-Requested-With: kqr header as specified in technical specification
 *
 * Cơ chế: website khác không thể tự gắn header tùy chỉnh vào request cross-origin
 * mà không qua preflight CORS — và preflight sẽ bị CORS whitelist chặn.
 * Gắn global trong app.ts nên route mới tự động được bảo vệ.
 */
export const csrfProtection: MiddlewareHandler<AppEnv> = async (c, next) => {
  const isMutating = MUTATING_METHODS.has(c.req.method.toUpperCase());

  if (isMutating && !CSRF_EXEMPT_PATHS.has(c.req.path)) {
    const headerVal = c.req.header(CSRF_HEADER_NAME);
    if (!headerVal || headerVal.toLowerCase() !== CSRF_HEADER_VALUE) {
      throw new ForbiddenError(
        "Yêu cầu bị từ chối do thiếu hoặc sai CSRF header (X-Requested-With)",
      );
    }
  }

  await next();
};
