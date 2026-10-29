import { and, count, eq } from "drizzle-orm";
import type { Database } from "../../../db/client";
import { pickBatches, tasks } from "../../../db/schema";

/**
 * Truy vấn khối lượng công việc đang mở của user (hiển thị trên /auth/me).
 */

export async function findOpenBatchByUserId(db: Database, userId: number) {
  const [batch] = await db
    .select({
      id: pickBatches.id,
      code: pickBatches.code,
      status: pickBatches.status,
      purpose: pickBatches.purpose,
    })
    .from(pickBatches)
    .where(
      and(eq(pickBatches.createdBy, userId), eq(pickBatches.status, "OPEN")),
    )
    .limit(1);
  return batch ?? null;
}

export async function countOpenTasksForUser(
  db: Database,
  userId: number,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(tasks)
    .where(and(eq(tasks.assignedTo, userId), eq(tasks.status, "OPEN")));
  return row?.total ?? 0;
}
