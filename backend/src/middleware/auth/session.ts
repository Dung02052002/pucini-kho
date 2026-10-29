import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../../env";
import { isExpired } from "../../lib/time";
import { findSessionById } from "../../modules/auth/repositories/session.repository";
import {
  findUserById,
  getUserPermissions,
} from "../../modules/auth/repositories/user.repository";
import { SESSION_COOKIE_NAME } from "../../shared/constants";

/**
 * Global authentication middleware
 * Parses session cookie or Authorization Bearer token and populates c.var.user and c.var.session
 * Middleware này KHÔNG chặn request; việc chặn do các guard đảm nhiệm.
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const cookieSessionId = getCookie(c, SESSION_COOKIE_NAME);
  const authHeader = c.req.header("authorization");
  const bearerSessionId = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const sessionId = cookieSessionId || bearerSessionId;

  if (sessionId) {
    const db = c.get("db");
    const session = await findSessionById(db, sessionId);

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
