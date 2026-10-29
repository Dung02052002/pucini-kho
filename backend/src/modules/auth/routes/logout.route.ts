import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { UnauthenticatedError } from "../../../lib/errors";
import { getRequestMeta } from "../../../lib/request-meta";
import { successResponse } from "../../../lib/response";
import { requireAuth } from "../../../middleware/auth/guards";
import { clearSessionCookie } from "../auth.cookie";
import { logoutUser } from "../services/logout.service";

/**
 * POST /api/v1/auth/logout — user (yêu cầu đăng nhập)
 * Xóa phiên hiện tại trong DB và xóa cookie `kqr_sid` ở trình duyệt.
 * Chưa đăng nhập / phiên hết hạn → 401 UNAUTHENTICATED.
 */
export const logoutRoute = new Hono<AppEnv>().post(
  "/logout",
  requireAuth,
  async (c) => {
    const session = c.get("session");
    if (!session) {
      throw new UnauthenticatedError();
    }

    await logoutUser(c.get("db"), session, getRequestMeta(c));

    clearSessionCookie(c);

    return successResponse(c, { success: true });
  },
);
