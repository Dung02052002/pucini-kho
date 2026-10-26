import { Hono } from "hono";
import { getConfig } from "../../config";
import type { AppEnv } from "../../env";
import { successResponse } from "../../lib/response";
import { checkHealth } from "./health.service";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/", async (c) => {
  const config = getConfig(c.env);
  const db = c.get("db");
  const healthData = await checkHealth(db, config.APP_VERSION);
  return successResponse(c, healthData, 200);
});
