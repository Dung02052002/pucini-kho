import type { Database } from "../../../db/client";
import type { AuthUser } from "../../../env";
import {
  countOpenTasksForUser,
  findOpenBatchByUserId,
} from "../repositories/user-workload.repository";
import type { MeResponseDto } from "../schemas/me.schema";

/**
 * Get current user information including profile, open batch and open task count
 */
export async function getCurrentUserProfile(
  db: Database,
  currentUser: AuthUser,
): Promise<MeResponseDto> {
  const [openBatch, openTaskCount] = await Promise.all([
    findOpenBatchByUserId(db, currentUser.id),
    countOpenTasksForUser(db, currentUser.id),
  ]);

  return {
    user: currentUser,
    openBatch,
    openTaskCount,
  };
}
