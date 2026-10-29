import { Hono } from "hono";
import type { AppEnv } from "./env";
import { requireAuthByDefault } from "./middleware/auth/access-policy";
import { authMiddleware } from "./middleware/auth/session";
import { dbMiddleware } from "./middleware/core/db";
import { errorHandler, notFoundHandler } from "./middleware/core/error-handler";
import { loggerMiddleware } from "./middleware/core/logger";
import { requestIdMiddleware } from "./middleware/core/request-id";
import { bodyLimitMiddleware } from "./middleware/security/body-limit";
import { corsMiddleware } from "./middleware/security/cors";
import { csrfProtection } from "./middleware/security/csrf";
import { securityHeadersMiddleware } from "./middleware/security/security-headers";
import { authRoutes } from "./modules/auth/auth.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { API_PREFIX } from "./shared/constants";

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Global Middlewares — thứ tự có ý nghĩa, đọc từ trên xuống:
  // 1. Hạ tầng: gắn request id, log
  app.use("*", requestIdMiddleware);
  app.use("*", loggerMiddleware);
  // 2. Bảo mật tầng HTTP: chạy trước khi đụng tới DB để chặn request xấu sớm và rẻ
  app.use("*", securityHeadersMiddleware);
  app.use("*", corsMiddleware()); // xử lý preflight OPTIONS trước CSRF
  app.use("*", bodyLimitMiddleware());
  app.use("*", csrfProtection);
  // 3. Xác thực: nạp session, sau đó chặn mọi route không nằm trong PUBLIC_ROUTES
  app.use("*", dbMiddleware);
  app.use("*", authMiddleware);
  app.use("*", requireAuthByDefault);

  // Custom Error & Not Found handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Route modules
  app.route(`${API_PREFIX}/health`, healthRoutes);
  app.route(`${API_PREFIX}/auth`, authRoutes);

  return app;
}
