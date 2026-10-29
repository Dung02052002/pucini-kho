import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { UnauthenticatedError } from "../../../lib/errors";
import { successResponse } from "../../../lib/response";
import { requireAuth } from "../../../middleware/auth/guards";
import { getCurrentUserProfile } from "../services/get-me.service";

/**
 * GET /api/v1/auth/me
 * Retrieves authenticated user information, open batch and pending task count
 */
export const meRoute = new Hono<AppEnv>().get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    throw new UnauthenticatedError();
  }

  const profile = await getCurrentUserProfile(c.get("db"), user);
  return successResponse(c, profile);
});
