import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { getRequestMeta } from "../../../lib/request-meta";
import { successResponse } from "../../../lib/response";
import { zValidator } from "../../../lib/validator";
import { rateLimit } from "../../../middleware/security/rate-limit";
import { setSessionCookie } from "../auth.cookie";
import { loginSchema } from "../schemas/login.schema";
import { loginUser } from "../services/login.service";

/**
 * POST /api/v1/auth/login
 * Public endpoint to authenticate with username & PIN/password
 * Bảo vệ: rate limit theo IP → validate body → khóa tài khoản sau nhiều lần sai (trong service).
 */
export const loginRoute = new Hono<AppEnv>().post(
  "/login",
  rateLimit({ prefix: "login", binding: (env) => env.LOGIN_RATE_LIMITER }),
  zValidator("json", loginSchema),
  async (c) => {
    const result = await loginUser(
      c.get("db"),
      c.req.valid("json"),
      getRequestMeta(c),
    );

    setSessionCookie(c, result.session.id, result.maxAge);

    return successResponse(c, {
      user: result.user,
      expiresAt: result.session.expiresAt,
    });
  },
);
