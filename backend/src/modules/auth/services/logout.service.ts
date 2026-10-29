import type { Database } from "../../../db/client";
import type { AuthSession } from "../../../env";
import type { RequestMeta } from "../../../lib/request-meta";
import { AUDIT_ACTIONS } from "../../audit/audit.actions";
import { logAudit } from "../../audit/services/log-audit.service";
import { deleteSession } from "../repositories/session.repository";

/**
 * Handle user logout by deleting the current session
 * Idempotent: không có session (đã hết hạn / chưa đăng nhập) thì không làm gì.
 */
export async function logoutUser(
  db: Database,
  session: AuthSession | undefined,
  meta: RequestMeta,
): Promise<void> {
  if (!session) {
    return;
  }

  await deleteSession(db, session.id);
  await logAudit(db, {
    userId: session.userId,
    action: AUDIT_ACTIONS.AUTH_LOGOUT,
    entity: "user",
    entityId: String(session.userId),
    payload: meta,
  });
}
