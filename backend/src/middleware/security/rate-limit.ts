import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";
import { RateLimitedError } from "../../lib/errors";
import { getClientIp } from "../../lib/request-meta";
import { incrementRateLimitCounter } from "../../modules/rate-limit/repositories/rate-limit.repository";

interface RateLimitOptions {
  /** Tiền tố phân biệt các limiter (vd: "login"), để không đếm lẫn giữa các endpoint */
  prefix: string;
  /** Số request tối đa trong 1 cửa sổ */
  limit: number;
  /** Độ dài cửa sổ (giây) */
  windowSeconds: number;
  /** Khóa đếm request; mặc định theo IP client */
  key?: (c: Context<AppEnv>) => string;
}

/**
 * Mốc bắt đầu của cửa sổ chứa thời điểm `nowMs`, làm tròn xuống theo bội số `windowSeconds`.
 * Ví dụ cửa sổ 10 phút: 10:07 → 10:00, 10:12 → 10:10.
 */
export function getWindowStart(nowMs: number, windowSeconds: number): string {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(nowMs / windowMs) * windowMs).toISOString();
}

/**
 * Rate limit theo cửa sổ cố định, lưu bộ đếm trong D1 (bảng rate_limits).
 *
 * Vượt `limit` trong cửa sổ hiện tại → 429 RATE_LIMITED, kèm số giây cần chờ.
 * Cần dbMiddleware chạy trước (đã gắn global trong app.ts).
 *
 * @example
 * route.post("/login", rateLimit({ prefix: "login", limit: 20, windowSeconds: 600 }), handler)
 */
export function rateLimit(
  options: RateLimitOptions,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const nowMs = Date.now();
    const windowStart = getWindowStart(nowMs, options.windowSeconds);
    const key = `${options.prefix}:${options.key?.(c) ?? getClientIp(c)}`;

    const count = await incrementRateLimitCounter(
      c.get("db"),
      key,
      windowStart,
    );

    if (count > options.limit) {
      const windowEndMs =
        new Date(windowStart).getTime() + options.windowSeconds * 1000;
      throw new RateLimitedError(undefined, {
        retryAfterSeconds: Math.ceil((windowEndMs - nowMs) / 1000),
      });
    }

    await next();
  };
}
