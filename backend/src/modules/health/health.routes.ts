import { Hono } from "hono";
import { getConfig } from "../../config";
import type { AppEnv } from "../../env";
import { checkHealth } from "./health.service";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/", async (c) => {
  const config = getConfig(c.env);
  const healthData = await checkHealth(c.env.DB, config.APP_VERSION);
  return c.json({ data: healthData }, 200);
});
