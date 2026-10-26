import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv, AuthSession, AuthUser } from "../env";
import {
  ForbiddenError,
  PermissionDeniedError,
  UnauthenticatedError,
} from "../lib/errors";
import { isExpired } from "../lib/time";
import {
  findSessionById,
  findUserById,
  getUserPermissions,
} from "../modules/auth/auth.repository";
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SESSION_COOKIE_NAME,
  type UserPermission,
  type UserRole,
} from "../shared/constants";

/**
 * Global authentication middleware
 * Parses session cookie or Authorization Bearer token and populates c.var.user and c.var.session
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
        const permissions = await getUserPermissions(db, user.id);

        const authUser: AuthUser = {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          permissions,
        };

        const authSession: AuthSession = {
          id: session.id,
          userId: session.userId,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        };

        c.set("user", authUser);
        c.set("session", authSession);
      }
    }
  }

  await next();
};

/**
 * Guard that requires an active authenticated session
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new UnauthenticatedError(
      "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn",
    );
  }
  await next();
};

/**
 * Guard that requires a specific UserRole (e.g. ADMIN)
 */
export function requireRole(requiredRole: UserRole): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new UnauthenticatedError(
        "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn",
      );
    }

    if (user.role !== requiredRole) {
      throw new PermissionDeniedError(
        "Bạn không có quyền thực hiện thao tác này",
        { requiredRole },
      );
    }

    await next();
  };
}

/**
 * Guard that requires a specific UserPermission (PICK, RETURN, REFILL, COUNT)
 * ADMIN role automatically bypasses and has all permissions
 */
export function requirePerm(
  requiredPerm: UserPermission,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new UnauthenticatedError(
        "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn",
      );
    }

    // ADMIN has all permissions
    if (user.role === "ADMIN") {
      return next();
    }

    // Check STAFF permissions
    if (!user.permissions.includes(requiredPerm)) {
      throw new PermissionDeniedError(`Bạn chưa có quyền ${requiredPerm}`, {
        perm: requiredPerm,
      });
    }

    await next();
  };
}

/**
 * CSRF Protection middleware for mutating state (POST, PUT, PATCH, DELETE)
 * Verifies X-Requested-With: kqr header as specified in technical specification
 */
export const csrfProtection: MiddlewareHandler<AppEnv> = async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const headerVal = c.req.header(CSRF_HEADER_NAME);
    if (!headerVal || headerVal.toLowerCase() !== CSRF_HEADER_VALUE) {
      throw new ForbiddenError(
        "Yêu cầu bị từ chối do thiếu hoặc sai CSRF header (X-Requested-With)",
      );
    }
  }
  await next();
};
