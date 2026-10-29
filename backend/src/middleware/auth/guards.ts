import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";
import { PermissionDeniedError, UnauthenticatedError } from "../../lib/errors";
import type { UserPermission, UserRole } from "../../shared/constants";

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
