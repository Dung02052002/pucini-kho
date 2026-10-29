import type { MiddlewareHandler } from "hono";
import { getDb } from "../../db/client";
import type { AppEnv } from "../../env";

/**
 * Injects Drizzle database client instance into Hono Context
 * Accessible via c.get("db")
 */
export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get("db")) {
    c.set("db", getDb(c.env));
  }
  await next();
};
