import { env } from "cloudflare:test";
import type { Hono } from "hono";
import type { AppEnv, Bindings } from "../../src/env";
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from "../../src/shared/constants";

/** Env dùng chung cho test */
export const testEnv: Bindings = { ...(env as unknown as Bindings) };

/**
 * Mỗi request mang 1 "IP client" riêng, để các test gọi login nhiều lần
 * không bị rate limit theo IP. Test rate limit tự truyền cf-connecting-ip cố định.
 */
function uniqueClientIp(): string {
  return `test-client-${crypto.randomUUID()}`;
}

// Helper to parse JSON without TS unknown warnings
// biome-ignore lint/suspicious/noExplicitAny: test helper
export async function parseJson<T = any>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
  /** Mặc định gửi kèm header CSRF như frontend thật; đặt false để test trường hợp thiếu */
  csrf?: boolean;
  env?: Bindings;
}

/**
 * Gửi request tới app giống cách frontend gọi: JSON body + header CSRF + cookie.
 */
export function apiRequest(
  app: Hono<AppEnv>,
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "cf-connecting-ip": uniqueClientIp(),
    ...options.headers,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.csrf !== false) headers[CSRF_HEADER_NAME] = CSRF_HEADER_VALUE;
  if (options.cookie) headers.Cookie = options.cookie;

  return Promise.resolve(
    app.request(
      path,
      {
        method: options.method ?? "GET",
        headers,
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
      },
      options.env ?? testEnv,
    ),
  );
}

/**
 * Đăng nhập và trả về cookie session (dạng "kqr_sid=...") để dùng cho request tiếp theo.
 */
export async function loginAndGetCookie(
  app: Hono<AppEnv>,
  username: string,
  pin: string,
): Promise<string> {
  const res = await apiRequest(app, "/api/v1/auth/login", {
    method: "POST",
    body: { username, pin },
  });
  const setCookie = res.headers.get("Set-Cookie");
  if (res.status !== 200 || !setCookie) {
    throw new Error(`Login failed for ${username}: HTTP ${res.status}`);
  }
  // Chỉ lấy phần "name=value", bỏ các thuộc tính Path/HttpOnly/...
  return setCookie.split(";")[0];
}
