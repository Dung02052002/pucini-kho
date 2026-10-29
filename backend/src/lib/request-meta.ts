import type { Context } from "hono";

/**
 * Thông tin client đi kèm request, dùng cho audit log và rate limit.
 * Tách khỏi Hono Context để service (không import Hono) vẫn nhận được.
 */
export interface RequestMeta {
  ip: string;
  userAgent: string | null;
}

/**
 * Lấy IP thật của client. Trên Cloudflare, `cf-connecting-ip` do edge gắn vào
 * và ghi đè giá trị client gửi lên nên tin cậy được. KHÔNG dùng X-Forwarded-For
 * (client tự giả mạo được). Local/test không có header → "unknown".
 */
export function getClientIp(c: Context): string {
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

export function getRequestMeta(c: Context): RequestMeta {
  return {
    ip: getClientIp(c),
    userAgent: c.req.header("user-agent") ?? null,
  };
}
