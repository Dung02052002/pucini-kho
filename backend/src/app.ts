import { Hono } from "hono";
import type { AppEnv } from "./env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { healthRoutes } from "./modules/health/health.routes";
import { API_PREFIX } from "./shared/constants";

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Global Middlewares
  app.use("*", requestIdMiddleware);
  app.use("*", loggerMiddleware);

  // Custom Error & Not Found handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Route modules
  app.route(`${API_PREFIX}/health`, healthRoutes);

  return app;
}
