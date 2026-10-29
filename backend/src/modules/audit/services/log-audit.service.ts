import type { Database } from "../../../db/client";
import { nowUtc } from "../../../lib/time";
import type { AuditAction } from "../audit.actions";
import { insertAuditLog } from "../repositories/audit-log.repository";

export interface LogAuditParams {
  userId?: number | null;
  action: AuditAction;
  entity?: string | null;
  entityId?: string | null;
  payload?: unknown;
}

/**
 * Record an audit log entry for security and compliance
 */
export async function logAudit(db: Database, params: LogAuditParams) {
  try {
    const payloadJson =
      params.payload !== undefined ? JSON.stringify(params.payload) : null;

    return await insertAuditLog(db, {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      payloadJson,
      createdAt: nowUtc(),
    });
  } catch (error) {
    // Fail-safe: Audit logging should not crash business transactions, but should log error
    console.error("[AuditLog Error] Failed to write audit log:", error);
  }
}
