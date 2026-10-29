import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";
import { ForbiddenError } from "../../lib/errors";
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from "../../shared/constants";

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
