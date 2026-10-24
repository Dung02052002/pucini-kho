export const API_PREFIX = "/api/v1";

export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  BAD_REQUEST: "Yêu cầu không hợp lệ",
  VALIDATION_ERROR: "Dữ liệu yêu cầu không hợp lệ",
  UNAUTHORIZED: "Yêu cầu xác thực tài khoản",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  NOT_FOUND: "Tài nguyên không tồn tại",
  CONFLICT: "Dữ liệu bị xung đột",
  INTERNAL_SERVER_ERROR: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau",
};

// Domain Enums & Values

export const USER_ROLES = ["ADMIN", "STAFF"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_PERMISSIONS = ["PICK", "RETURN", "REFILL", "COUNT"] as const;
export type UserPermission = (typeof USER_PERMISSIONS)[number];

export const BATCH_PURPOSES = ["TRANSFER", "SALE", "DAMAGE", "OTHER"] as const;
export type BatchPurpose = (typeof BATCH_PURPOSES)[number];

export const BATCH_STATUSES = [
  "OPEN",
  "COMPLETED",
  "LINKED",
  "CANCELED",
] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const KV_DOC_TYPES = [
  "INVOICE",
  "TRANSFER",
  "PURCHASE",
  "DAMAGE",
  "RETURN",
] as const;
export type KvDocType = (typeof KV_DOC_TYPES)[number];

export const MATCH_TYPES = ["NOTE", "SCORE", "MANUAL"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const TASK_TYPES = ["REFILL", "COUNT", "RETURN"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ["OPEN", "DONE", "CANCELED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MOVEMENT_TYPES = [
  "INIT",
  "PICK",
  "RETURN",
  "REFILL",
  "COUNT",
  "MOVE_OUT",
  "MOVE_IN",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const RETURN_REASONS = [
  "DOC_EDITED",
  "DOC_CANCELED",
  "OVER_PICK",
  "CUSTOMER_RETURN",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];
