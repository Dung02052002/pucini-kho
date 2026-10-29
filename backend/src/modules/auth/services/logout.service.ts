import type { Database } from "../../../db/client";
import type { AuthSession } from "../../../env";
import type { RequestMeta } from "../../../lib/request-meta";
import { AUDIT_ACTIONS } from "../../audit/audit.actions";
import { logAudit } from "../../audit/services/log-audit.service";
import { deleteSession } from "../repositories/session.repository";

/**
 * Handle user logout by deleting the current session
 * Chỉ xóa phiên đang dùng; các thiết bị khác của cùng user vẫn đăng nhập.
 */
export async function logoutUser(
  db: Database,
  session: AuthSession,
  meta: RequestMeta,
): Promise<void> {
  await deleteSession(db, session.id);

  await logAudit(db, {
    userId: session.userId,
    action: AUDIT_ACTIONS.AUTH_LOGOUT,
    entity: "user",
    entityId: String(session.userId),
    payload: meta,
  });
}
