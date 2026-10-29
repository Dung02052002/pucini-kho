export const API_PREFIX = "/api/v1";

export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export const SESSION_COOKIE_NAME = "kqr_sid";
export const CSRF_HEADER_NAME = "x-requested-with";
export const CSRF_HEADER_VALUE = "kqr";

export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  QR_INVALID: "QR_INVALID",
  UNDO_EXPIRED: "UNDO_EXPIRED",
  ALREADY_CANCELED: "ALREADY_CANCELED",
  BATCH_NOT_OPEN: "BATCH_NOT_OPEN",
  SYNC_THROTTLED: "SYNC_THROTTLED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  KV_UPSTREAM_ERROR: "KV_UPSTREAM_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  BAD_REQUEST: "Yêu cầu không hợp lệ",
  VALIDATION_ERROR: "Dữ liệu yêu cầu không hợp lệ",
  UNAUTHORIZED: "Yêu cầu xác thực tài khoản",
  UNAUTHENTICATED: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  PERMISSION_DENIED: "Bạn không có quyền thực hiện thao tác này",
  NOT_FOUND: "Tài nguyên không tồn tại",
  CONFLICT: "Dữ liệu bị xung đột",
  ACCOUNT_LOCKED:
    "Tài khoản bị tạm khóa do nhập sai PIN quá nhiều lần (15 phút)",
  QR_INVALID: "Mã tem QR không hợp lệ hoặc ô kệ đang ngừng sử dụng",
  UNDO_EXPIRED: "Đã quá thời gian cho phép hoàn tác (10 giây)",
  ALREADY_CANCELED: "Biến động này đã được hủy trước đó",
  BATCH_NOT_OPEN: "Đợt soạn hàng đã hoàn tất hoặc không còn mở",
  SYNC_THROTTLED: "Hệ thống đang đồng bộ, vui lòng thử lại sau 60 giây",
  PAYLOAD_TOO_LARGE: "Dữ liệu gửi lên vượt quá kích thước cho phép",
  KV_UPSTREAM_ERROR: "Lỗi kết nối hoặc phản hồi từ KiotViet",
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
