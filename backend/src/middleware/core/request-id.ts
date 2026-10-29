import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../env";
import { generateRequestId } from "../../lib/ids";

/**
 * Chỉ chấp nhận X-Request-Id từ client nếu ngắn và an toàn (chữ, số, "-", "_").
 * Giá trị này được ghi vào log và phản hồi lại trong header, nên không tin dữ liệu
 * tùy ý từ client (chống log injection / header quá dài).
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const clientId = c.req.header("x-request-id");
  const requestId =
    clientId && SAFE_REQUEST_ID.test(clientId) ? clientId : generateRequestId();

  c.set("requestId", requestId);

  await next();

  c.res.headers.set("X-Request-Id", requestId);
});
