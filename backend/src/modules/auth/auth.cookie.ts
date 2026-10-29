import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import type { AppEnv } from "../../env";
import { SESSION_COOKIE_NAME } from "../../shared/constants";

/**
 * Thuộc tính cookie session — dùng chung cho set và delete để trình duyệt
 * nhận diện đúng cùng 1 cookie khi xóa.
 * - httpOnly: JS phía client không đọc được (chống đánh cắp qua XSS)
 * - secure: chỉ gửi qua HTTPS
 * - sameSite Lax: không gửi kèm request POST cross-site
 */
const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
};

export function setSessionCookie(
  c: Context<AppEnv>,
  token: string,
  maxAge: number,
): void {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge,
  });
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
}
