import { z } from "zod";
import type { Bindings } from "./env";

export const configSchema = z.object({
  ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
  APP_VERSION: z.string().default("1.0.0"),
  APP_TZ: z.string().default("Asia/Ho_Chi_Minh"),
  KV_RETAILER: z.string().optional(),
  KV_BRANCH_ID: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    ),
});

export type Config = z.infer<typeof configSchema>;

export function getConfig(env: Bindings): Config {
  return configSchema.parse({
    ENVIRONMENT: env.ENVIRONMENT ?? "development",
    APP_VERSION: env.APP_VERSION ?? "1.0.0",
    APP_TZ: env.APP_TZ ?? "Asia/Ho_Chi_Minh",
    KV_RETAILER: env.KV_RETAILER,
    KV_BRANCH_ID: env.KV_BRANCH_ID,
    SESSION_SECRET: env.SESSION_SECRET,
    CORS_ORIGINS: env.CORS_ORIGINS,
  });
}
