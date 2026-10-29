import { sql } from "drizzle-orm";
import type { Database } from "../../../db/client";
import { rateLimits } from "../../../db/schema";

/**
 * Tăng bộ đếm của `key` trong cửa sổ `windowStart` bằng 1 câu UPSERT nguyên tử:
 * - Chưa có dòng → tạo mới với count = 1.
 * - Cùng cửa sổ → count + 1.
 * - Đã sang cửa sổ mới → đặt lại count = 1 và cập nhật window_start.
 *
 * Nguyên tử nên nhiều request song song không đếm sót (không đọc rồi mới ghi).
 *
 * @returns số request đã ghi nhận trong cửa sổ hiện tại (tính cả request này)
 */
export async function incrementRateLimitCounter(
  db: Database,
  key: string,
  windowStart: string,
): Promise<number> {
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} = excluded.window_start THEN ${rateLimits.count} + 1 ELSE 1 END`,
        windowStart: sql`excluded.window_start`,
      },
    })
    .returning({ count: rateLimits.count });

  return row.count;
}
