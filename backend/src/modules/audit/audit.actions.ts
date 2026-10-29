/**
 * Tên hành động ghi vào audit_log.action — dùng hằng số để truy vấn/thống kê nhất quán.
 * Quy ước: <MODULE>_<HÀNH_ĐỘNG>.
 */
export const AUDIT_ACTIONS = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_ACCOUNT_LOCKED: "AUTH_ACCOUNT_LOCKED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
