export interface HealthCheckResult {
  status: "ok" | "error";
  version: string;
  db: "ok" | "error";
}

export async function checkHealth(
  db: D1Database,
  version: string,
): Promise<HealthCheckResult> {
  let dbStatus: "ok" | "error" = "ok";

  try {
    await db.prepare("SELECT 1").run();
  } catch (error) {
    console.error("D1 health check failed:", error);
    dbStatus = "error";
  }

  return {
    status: "ok",
    version,
    db: dbStatus,
  };
}
