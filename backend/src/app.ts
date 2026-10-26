import { Hono } from "hono";
import type { AppEnv } from "./env";
import { authMiddleware } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { dbMiddleware } from "./middleware/db";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { securityHeadersMiddleware } from "./middleware/security-headers";
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
