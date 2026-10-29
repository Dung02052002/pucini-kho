import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { getRequestMeta } from "../../../lib/request-meta";
import { successResponse } from "../../../lib/response";
import { clearSessionCookie } from "../auth.cookie";
import { logoutUser } from "../services/logout.service";

/**
 * POST /api/v1/auth/logout
 * Destroys current session and deletes session cookie
 */
export const logoutRoute = new Hono<AppEnv>().post("/logout", async (c) => {
  await logoutUser(c.get("db"), c.get("session"), getRequestMeta(c));

  clearSessionCookie(c);

  return successResponse(c, { success: true });
});
