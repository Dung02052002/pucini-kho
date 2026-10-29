import { eq } from "drizzle-orm";
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

export async function updateFailedAttempts(
  db: Database,
  userId: number,
  failedAttempts: number,
  lockedUntil: string | null,
): Promise<void> {
  await db
    .update(users)
    .set({ failedAttempts, lockedUntil })
    .where(eq(users.id, userId));
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
