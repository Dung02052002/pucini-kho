import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "../../env";
import { RateLimitedError } from "../../lib/errors";
import { getClientIp } from "../../lib/request-meta";

interface RateLimitOptions {
  /** Lấy binding Cloudflare Rate Limiting từ env (mỗi binding có limit/period riêng trong wrangler.jsonc) */
  binding: (env: Bindings) => RateLimit | undefined;
  /** Khóa đếm request; mặc định theo IP client */
  key?: (c: Context<AppEnv>) => string;
  /** Tiền tố để các limiter dùng chung binding không đếm lẫn nhau */
  prefix: string;
}

/**
 * Rate limit theo IP (hoặc khóa tùy chỉnh) dùng Cloudflare Rate Limiting binding.
 *
 * Nếu binding không tồn tại (dev local / test) thì bỏ qua. Production phải khai báo
 * binding trong wrangler.jsonc — xem mục "ratelimits".
 */
export function rateLimit(
  options: RateLimitOptions,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const limiter = options.binding(c.env);

    if (limiter) {
      const key = options.key?.(c) ?? getClientIp(c);
      const { success } = await limiter.limit({
        key: `${options.prefix}:${key}`,
      });
      if (!success) {
        throw new RateLimitedError();
      }
    }

    await next();
  };
}
