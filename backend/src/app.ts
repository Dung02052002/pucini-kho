import { Hono } from "hono";
import type { AppEnv } from "./env";
import { authMiddleware } from "./middleware/auth/session";
import { dbMiddleware } from "./middleware/core/db";
import { errorHandler, notFoundHandler } from "./middleware/core/error-handler";
import { loggerMiddleware } from "./middleware/core/logger";
import { requestIdMiddleware } from "./middleware/core/request-id";
import { corsMiddleware } from "./middleware/security/cors";
import { securityHeadersMiddleware } from "./middleware/security/security-headers";
import { authRoutes } from "./modules/auth/auth.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { API_PREFIX } from "./shared/constants";

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Global Middlewares
  app.use("*", requestIdMiddleware);
  app.use("*", loggerMiddleware);
  app.use("*", securityHeadersMiddleware);
  app.use("*", corsMiddleware());
  app.use("*", dbMiddleware);
  app.use("*", authMiddleware);

  // Custom Error & Not Found handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Route modules
  app.route(`${API_PREFIX}/health`, healthRoutes);
  app.route(`${API_PREFIX}/auth`, authRoutes);

  return app;
}
