import type { Database } from "../../../db/client";
import { pingDatabase } from "../repositories/health.repository";
import type { HealthCheckResult } from "../schemas/health.schema";

export async function checkHealth(
  db: Database,
  version: string,
): Promise<HealthCheckResult> {
  const isDbOk = await pingDatabase(db);

  return {
    status: isDbOk ? "ok" : "error",
    version,
    db: isDbOk ? "ok" : "error",
  };
}

export type { HealthCheckResult };
