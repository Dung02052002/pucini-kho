import { Hono } from "hono";
import { getConfig } from "../../../config";
import type { AppEnv } from "../../../env";
import { successResponse } from "../../../lib/response";
import { checkHealth } from "../services/check-health.service";

/**
 * GET /api/v1/health
 * Public endpoint kiểm tra Worker và kết nối D1 còn hoạt động.
 */
export const getHealthRoute = new Hono<AppEnv>().get("/", async (c) => {
  const config = getConfig(c.env);
  const healthData = await checkHealth(c.get("db"), config.APP_VERSION);
  return successResponse(c, healthData);
});
