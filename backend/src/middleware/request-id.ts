import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { generateRequestId } from "../lib/ids";

export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const existingId =
    c.req.header("x-request-id") || c.req.header("X-Request-Id");
  const requestId = existingId || generateRequestId();

  c.set("requestId", requestId);

  await next();

  c.res.headers.set("X-Request-Id", requestId);
});
