import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import {
  type NewSession,
  pickBatches,
  type Session,
  sessions,
  tasks,
  type User,
  userPermissions,
  users,
} from "../../db/schema";
import type { UserPermission } from "../../shared/constants";

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
    .set({
      failedAttempts,
      lockedUntil,
    })
    .where(eq(users.id, userId));
}

export async function resetFailedAttempts(
  db: Database,
  userId: number,
): Promise<void> {
  await db
    .update(users)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId));
}

export async function createSession(
  db: Database,
  session: NewSession,
): Promise<Session> {
  const [created] = await db.insert(sessions).values(session).returning();
  return created;
}

export async function findSessionById(
  db: Database,
  sessionId: string,
): Promise<Session | undefined> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return session;
}

export async function deleteSession(
  db: Database,
  sessionId: string,
): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteSessionsByUserId(
  db: Database,
  userId: number,
): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

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
  const openTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.assignedTo, userId), eq(tasks.status, "OPEN")));
  return openTasks.length;
}
