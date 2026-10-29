import type { Database } from "../../../db/client";
import type { AuthUser } from "../../../env";
import { verifyPin } from "../../../lib/crypto";
import { AccountLockedError, UnauthenticatedError } from "../../../lib/errors";
import { generateSessionId } from "../../../lib/ids";
import {
  addDays,
  addHours,
  addMinutes,
  isExpired,
  nowUtc,
} from "../../../lib/time";
import { createSession } from "../repositories/session.repository";
import {
  findUserByUsername,
  getUserPermissions,
  resetFailedAttempts,
  updateFailedAttempts,
} from "../repositories/user.repository";
import type { LoginInput } from "../schemas/login.schema";

export interface LoginResult {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: string;
  };
  maxAge: number;
}

/**
 * Handle user login with username & PIN/password
 * Implements anti brute-force logic: locks for 15 minutes after 5 consecutive failures
 */
export async function loginUser(
  db: Database,
  input: LoginInput,
  userAgent: string | null = null,
): Promise<LoginResult> {
  const user = await findUserByUsername(db, input.username);

  // User not found or inactive
  if (!user || user.active === 0) {
    throw new UnauthenticatedError("Tên đăng nhập hoặc mã PIN không chính xác");
  }

  // Check if account is currently locked
  if (user.lockedUntil && !isExpired(user.lockedUntil)) {
    throw new AccountLockedError(
      "Tài khoản bị tạm khóa do nhập sai PIN quá 5 lần. Vui lòng thử lại sau 15 phút.",
    );
  }

  // Verify PIN with PBKDF2 hash
  const isPinValid = await verifyPin(input.pin, user.pinHash);

  if (!isPinValid) {
    const nextFailedAttempts = user.failedAttempts + 1;

    if (nextFailedAttempts >= 5) {
      await updateFailedAttempts(
        db,
        user.id,
        nextFailedAttempts,
        addMinutes(15),
      );
      throw new AccountLockedError(
        "Bạn đã nhập sai mã PIN 5 lần liên tiếp. Tài khoản đã bị tạm khóa 15 phút.",
      );
    }

    await updateFailedAttempts(db, user.id, nextFailedAttempts, null);
    const attemptsLeft = 5 - nextFailedAttempts;
    throw new UnauthenticatedError(
      `Mã PIN không chính xác. Bạn còn ${attemptsLeft} lần thử trước khi bị khóa.`,
    );
  }

  // Login successful: reset failed attempts if any
  if (user.failedAttempts > 0 || user.lockedUntil) {
    await resetFailedAttempts(db, user.id);
  }

  // Session duration: 30 days if remember is true, else 12 hours
  const maxAge = input.remember ? 30 * 24 * 3600 : 12 * 3600;
  const expiresAt = input.remember ? addDays(30) : addHours(12);

  const sessionId = generateSessionId();
  await createSession(db, {
    id: sessionId,
    userId: user.id,
    userAgent,
    createdAt: nowUtc(),
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: await getUserPermissions(db, user.id),
    },
    session: { id: sessionId, expiresAt },
    maxAge,
  };
}
