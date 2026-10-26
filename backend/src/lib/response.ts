import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../env";

export function successResponse<T>(
  c: Context<AppEnv>,
  data: T,
  status: ContentfulStatusCode = 200,
  headers?: Record<string, string>,
) {
  const requestId = c.get("requestId");
  return c.json({ data }, status, {
    ...(requestId ? { "X-Request-Id": requestId } : {}),
    ...headers,
  });
}
