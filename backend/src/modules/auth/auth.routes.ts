import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { loginRoute } from "./routes/login.route";
import { logoutRoute } from "./routes/logout.route";
import { meRoute } from "./routes/me.route";

/**
 * Router của module auth — chỉ gom các route con, không chứa logic.
 * Mount tại `${API_PREFIX}/auth` trong app.ts.
 */
export const authRoutes = new Hono<AppEnv>()
  .route("/", loginRoute)
  .route("/", logoutRoute)
  .route("/", meRoute);
