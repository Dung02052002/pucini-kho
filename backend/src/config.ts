import { z } from "zod";
import type { Bindings } from "./env";

export const configSchema = z.object({
  ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
  APP_VERSION: z.string().default("1.0.0"),
});

export type Config = z.infer<typeof configSchema>;

export function getConfig(env: Bindings): Config {
  return configSchema.parse({
    ENVIRONMENT: env.ENVIRONMENT ?? "development",
    APP_VERSION: env.APP_VERSION ?? "1.0.0",
  });
}
