import { sql } from "drizzle-orm";
import type { Database } from "../../../db/client";

/**
 * Pings database using Drizzle ORM to verify connection health
 */
export async function pingDatabase(db: Database): Promise<boolean> {
  try {
    await db.run(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[HealthRepository] Database ping failed:", error);
    return false;
  }
}
