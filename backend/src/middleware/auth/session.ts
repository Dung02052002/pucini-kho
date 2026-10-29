import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../../env";
import { hashSessionToken } from "../../lib/crypto";
import { isExpired } from "../../lib/time";
import { findSessionById } from "../../modules/auth/repositories/session.repository";
import {
  findUserById,
  getUserPermissions,
} from "../../modules/auth/repositories/user.repository";
import { SESSION_COOKIE_NAME } from "../../shared/constants";

/** Token hợp lệ là base64url của 32 byte = 43 ký tự; chặn sớm giá trị rác trước khi hash/query DB */
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Lấy session token từ cookie (ưu tiên) hoặc header `Authorization: Bearer <token>`.
 */
function extractSessionToken(
  cookieValue: string | undefined,
  authHeader: string | undefined,
): string | undefined {
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const token = cookieValue || bearer;
  return token && SESSION_TOKEN_PATTERN.test(token) ? token : undefined;
}

/**
 * Global authentication middleware
 * Đọc session token → hash → tra DB → gán c.var.user và c.var.session.
 * Middleware này KHÔNG chặn request; việc chặn do requireAuthByDefault / guards đảm nhiệm.
 * Quyền và trạng thái active được đọc lại mỗi request nên khóa user có hiệu lực ngay.
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = extractSessionToken(
    getCookie(c, SESSION_COOKIE_NAME),
    c.req.header("authorization"),
  );

  if (token) {
    const db = c.get("db");
    const session = await findSessionById(db, await hashSessionToken(token));

    if (session && !isExpired(session.expiresAt)) {
      const user = await findUserById(db, session.userId);

      if (user && user.active === 1) {
        c.set("user", {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          permissions: await getUserPermissions(db, user.id),
        });
        c.set("session", {
          id: session.id,
          userId: session.userId,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        });
      }
    }
  }

  await next();
};
