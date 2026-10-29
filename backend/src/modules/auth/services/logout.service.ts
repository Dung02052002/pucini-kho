import type { Database } from "../../../db/client";
import { deleteSession } from "../repositories/session.repository";

/**
 * Handle user logout by deleting the current session
 */
export async function logoutUser(
  db: Database,
  sessionId?: string,
): Promise<void> {
  if (sessionId) {
    await deleteSession(db, sessionId);
  }
}
