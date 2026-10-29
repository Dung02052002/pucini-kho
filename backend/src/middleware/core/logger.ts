import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../env";

export const loggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const ms = Date.now() - start;
  const status = c.res.status;
  const requestId = c.get("requestId") || "";

  console.log(
    JSON.stringify({
      method,
      path,
      status,
      ms,
      requestId,
    }),
  );
});
