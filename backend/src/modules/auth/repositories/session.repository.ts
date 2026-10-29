import { eq } from "drizzle-orm";
import type { Database } from "../../../db/client";
import { type NewSession, type Session, sessions } from "../../../db/schema";

/**
 * Lưu ý: `sessions.id` là SHA-256 của token (xem lib/crypto/token.ts),
 * mọi hàm ở đây nhận/trả giá trị hash, không bao giờ nhận token gốc.
 */

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
