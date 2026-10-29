import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { Database } from "../../../db/client";
import { type User, userPermissions, users } from "../../../db/schema";
import type { UserPermission } from "../../../shared/constants";

export async function findUserByUsername(
  db: Database,
  username: string,
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
}

export async function findUserById(
  db: Database,
  userId: number,
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user;
}

export async function getUserPermissions(
  db: Database,
  userId: number,
): Promise<UserPermission[]> {
  const perms = await db
    .select({ perm: userPermissions.perm })
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));
  return perms.map((p) => p.perm);
}

interface ReserveLoginAttemptParams {
  userId: number;
  now: string;
  lockUntil: string;
  maxAttempts: number;
}

/**
 * "Giữ chỗ" 1 lượt đăng nhập TRƯỚC khi kiểm tra PIN, bằng 1 câu UPDATE nguyên tử:
 * - Tài khoản đang bị khóa → không update được → trả null.
 * - Lần khóa trước đã hết hạn → đếm lại từ 1; ngược lại → failed_attempts + 1.
 * - Nếu lượt này chạm ngưỡng → đặt luôn locked_until trong cùng câu lệnh.
 *
 * Vì đếm trước khi verify, gửi song song N request cũng chỉ có tối đa `maxAttempts`
 * lượt được kiểm tra PIN (tránh race condition đọc-rồi-ghi). Đăng nhập thành công
 * sẽ gọi resetFailedAttempts để xóa lượt đã giữ.
 *
 * Thời gian lưu dạng ISO-8601 UTC cùng độ dài nên so sánh chuỗi tương đương so sánh thời gian.
 *
 * @returns số lần sai (tính cả lượt hiện tại), hoặc null nếu tài khoản đang bị khóa
 */
export async function reserveLoginAttempt(
  db: Database,
  { userId, now, lockUntil, maxAttempts }: ReserveLoginAttemptParams,
): Promise<number | null> {
  const nextAttempts = sql`CASE WHEN ${users.lockedUntil} IS NOT NULL AND ${users.lockedUntil} <= ${now} THEN 1 ELSE ${users.failedAttempts} + 1 END`;

  const [row] = await db
    .update(users)
    .set({
      failedAttempts: nextAttempts,
      lockedUntil: sql`CASE WHEN (${nextAttempts}) >= ${maxAttempts} THEN ${lockUntil} ELSE NULL END`,
    })
    .where(
      and(
        eq(users.id, userId),
        or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),
      ),
    )
    .returning({ failedAttempts: users.failedAttempts });

  return row?.failedAttempts ?? null;
}

export async function resetFailedAttempts(
  db: Database,
  userId: number,
): Promise<void> {
  await db
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId));
}
