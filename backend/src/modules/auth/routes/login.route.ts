import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { successResponse } from "../../../lib/response";
import { zValidator } from "../../../lib/validator";
import { setSessionCookie } from "../auth.cookie";
import { loginSchema } from "../schemas/login.schema";
import { loginUser } from "../services/login.service";

/**
 * POST /api/v1/auth/login
 * Public endpoint to authenticate with username & PIN/password
 */
export const loginRoute = new Hono<AppEnv>().post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    const result = await loginUser(
      c.get("db"),
      c.req.valid("json"),
      c.req.header("user-agent") ?? null,
    );

    setSessionCookie(c, result.session.id, result.maxAge);

    return successResponse(c, {
      user: result.user,
      expiresAt: result.session.expiresAt,
    });
  },
);
