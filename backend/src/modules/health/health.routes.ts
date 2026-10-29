import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { getHealthRoute } from "./routes/get-health.route";

/**
 * Router của module health — chỉ gom các route con, không chứa logic.
 * Mount tại `${API_PREFIX}/health` trong app.ts.
 */
export const healthRoutes = new Hono<AppEnv>().route("/", getHealthRoute);
