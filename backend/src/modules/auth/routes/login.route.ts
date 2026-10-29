import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { getRequestMeta } from "../../../lib/request-meta";
import { successResponse } from "../../../lib/response";
import { zValidator } from "../../../lib/validator";
import { rateLimit } from "../../../middleware/security/rate-limit";
import { setSessionCookie } from "../auth.cookie";
import {
  LOGIN_RATE_LIMIT_MAX_REQUESTS,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
} from "../auth.policy";
import { loginSchema } from "../schemas/login.schema";
import { loginUser } from "../services/login.service";

/**
 * POST /api/v1/auth/login — public
 * Body: { username, pin, remember } → set cookie phiên `kqr_sid`, trả thông tin user.
 *
 * Các lớp bảo vệ theo thứ tự:
 * 1. CSRF header (global, app.ts)
 * 2. Rate limit 20 lần / IP / 10 phút
 * 3. Validate body bằng Zod
 * 4. Khóa tài khoản 15 phút sau 5 lần sai PIN (trong login.service)
 */
export const loginRoute = new Hono<AppEnv>().post(
  "/login",
  rateLimit({
    prefix: "login",
    limit: LOGIN_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  }),
  zValidator("json", loginSchema),
  async (c) => {
    const result = await loginUser(
      c.get("db"),
      c.req.valid("json"),
      getRequestMeta(c),
    );

    // Token gốc chỉ nằm trong cookie HttpOnly, không bao giờ trả trong body
    setSessionCookie(c, result.session.token, result.maxAge);

    return successResponse(c, {
      user: result.user,
      expiresAt: result.session.expiresAt,
    });
  },
);
