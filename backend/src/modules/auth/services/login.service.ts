import type { Database } from "../../../db/client";
import type { AuthUser } from "../../../env";
import {
  generateSessionToken,
  hashSessionToken,
  verifyAgainstDummyHash,
  verifyPin,
} from "../../../lib/crypto";
import { AccountLockedError, UnauthenticatedError } from "../../../lib/errors";
import type { RequestMeta } from "../../../lib/request-meta";
import { addDays, addHours, addMinutes, nowUtc } from "../../../lib/time";
import {
  ACCOUNT_LOCK_MINUTES,
  INVALID_CREDENTIALS_MESSAGE,
  MAX_FAILED_LOGIN_ATTEMPTS,
  REMEMBER_SESSION_TTL_DAYS,
  SESSION_TTL_HOURS,
} from "../auth.policy";
import { createSession } from "../repositories/session.repository";
import {
  findUserByUsername,
  getUserPermissions,
  reserveLoginAttempt,
  resetFailedAttempts,
} from "../repositories/user.repository";
import type { LoginInput } from "../schemas/login.schema";

export interface LoginResult {
  user: AuthUser;
  session: {
    /** Token gốc — chỉ dùng để set cookie, không bao giờ lưu DB */
    token: string;
    expiresAt: string;
  };
  maxAge: number;
}

/**
 * Handle user login with username & PIN/password
 *
 * Luồng xử lý:
 * 1. Không tìm thấy user / user ngưng hoạt động → vẫn chạy PBKDF2 với hash giả
 *    (thời gian phản hồi như sai PIN) rồi trả thông báo chung.
 * 2. Giữ chỗ 1 lượt thử bằng UPDATE nguyên tử; tài khoản đang khóa → 423.
 * 3. Verify PIN. Sai → 401 (hoặc 423 nếu lượt này chạm ngưỡng khóa).
 * 4. Đúng → reset bộ đếm, tạo session (DB lưu hash của token).
 *
 * Đánh đổi có chủ đích: lỗi 423 vẫn cho biết username tồn tại, vì nhân viên kho
 * cần biết mình bị khóa. Rủi ro dò username được giảm bằng rate limit theo IP.
 */
export async function loginUser(
  db: Database,
  input: LoginInput,
  meta: RequestMeta,
): Promise<LoginResult> {
  const user = await findUserByUsername(db, input.username);

  // Bước 1: user không hợp lệ — không tiết lộ lý do cụ thể cho client
  if (!user || user.active === 0) {
    await verifyAgainstDummyHash(input.pin);
    throw new UnauthenticatedError(INVALID_CREDENTIALS_MESSAGE);
  }

  // Bước 2: giữ chỗ lượt thử (chống brute-force song song)
  const attempts = await reserveLoginAttempt(db, {
    userId: user.id,
    now: nowUtc(),
    lockUntil: addMinutes(ACCOUNT_LOCK_MINUTES),
    maxAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
  });

  if (attempts === null) {
    throw new AccountLockedError(
      `Tài khoản bị tạm khóa do nhập sai PIN quá ${MAX_FAILED_LOGIN_ATTEMPTS} lần. Vui lòng thử lại sau ${ACCOUNT_LOCK_MINUTES} phút.`,
    );
  }

  // Bước 3: verify PIN
  const isPinValid = await verifyPin(input.pin, user.pinHash);

  if (!isPinValid) {
    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new AccountLockedError(
        `Bạn đã nhập sai mã PIN ${MAX_FAILED_LOGIN_ATTEMPTS} lần liên tiếp. Tài khoản đã bị tạm khóa ${ACCOUNT_LOCK_MINUTES} phút.`,
      );
    }
    throw new UnauthenticatedError(INVALID_CREDENTIALS_MESSAGE);
  }

  // Bước 4: đăng nhập thành công
  await resetFailedAttempts(db, user.id);

  const maxAge = input.remember
    ? REMEMBER_SESSION_TTL_DAYS * 24 * 3600
    : SESSION_TTL_HOURS * 3600;
  const expiresAt = input.remember
    ? addDays(REMEMBER_SESSION_TTL_DAYS)
    : addHours(SESSION_TTL_HOURS);

  const token = generateSessionToken();
  await createSession(db, {
    id: await hashSessionToken(token),
    userId: user.id,
    userAgent: meta.userAgent,
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
    session: { token, expiresAt },
    maxAge,
  };
}
