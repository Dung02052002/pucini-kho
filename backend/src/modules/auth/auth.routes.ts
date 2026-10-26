import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../../env";
import { UnauthenticatedError } from "../../lib/errors";
import { successResponse } from "../../lib/response";
import { zValidator } from "../../lib/validator";
import { requireAuth } from "../../middleware/auth";
import { SESSION_COOKIE_NAME } from "../../shared/constants";
import { loginSchema } from "./auth.schemas";
import { getCurrentUserProfile, loginUser, logoutUser } from "./auth.service";

export const authRoutes = new Hono<AppEnv>();

/**
 * POST /api/v1/auth/login
 * Public endpoint to authenticate with username & PIN/password
 */
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const db = c.get("db");
  const input = c.req.valid("json");
  const userAgent = c.req.header("user-agent") ?? null;

  const result = await loginUser(db, input, userAgent);

  setCookie(c, SESSION_COOKIE_NAME, result.session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: result.maxAge,
  });

  return successResponse(
    c,
    {
      user: result.user,
      expiresAt: result.session.expiresAt,
    },
    200,
  );
});

/**
 * POST /api/v1/auth/logout
 * Destroys current session and deletes session cookie
 */
authRoutes.post("/logout", async (c) => {
  const db = c.get("db");
  const session = c.get("session");

  await logoutUser(db, session?.id);

  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
    secure: true,
    sameSite: "Lax",
  });

  return successResponse(c, { success: true }, 200);
});

/**
 * GET /api/v1/auth/me
 * Retrieves authenticated user information, open batch and pending task count
 */
authRoutes.get("/me", requireAuth, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  if (!user) {
    throw new UnauthenticatedError();
  }

  const profile = await getCurrentUserProfile(db, user);
  return successResponse(c, profile, 200);
});
