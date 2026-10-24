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
