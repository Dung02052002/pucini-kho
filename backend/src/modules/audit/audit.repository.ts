import type { Database } from "../../db/client";
import { auditLog, type NewAuditLogEntry } from "../../db/schema";

export async function insertAuditLog(db: Database, entry: NewAuditLogEntry) {
  const [created] = await db.insert(auditLog).values(entry).returning();
  return created;
}
