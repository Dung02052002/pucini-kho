import { z } from "zod";

export const healthCheckResultSchema = z.object({
  status: z.enum(["ok", "error"]),
  version: z.string(),
  db: z.enum(["ok", "error"]),
});

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>;
