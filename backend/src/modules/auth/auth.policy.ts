/**
 * Các tham số chính sách đăng nhập — đổi ở 1 nơi duy nhất.
 */

/** Số lần nhập sai PIN liên tiếp trước khi khóa tài khoản */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Thời gian khóa tài khoản sau khi vượt số lần sai cho phép */
export const ACCOUNT_LOCK_MINUTES = 15;

/** Thời hạn phiên đăng nhập */
export const SESSION_TTL_HOURS = 12;
export const REMEMBER_SESSION_TTL_DAYS = 30;

/** Thông báo chung cho mọi trường hợp sai thông tin — không tiết lộ username có tồn tại hay không */
export const INVALID_CREDENTIALS_MESSAGE =
  "Tên đăng nhập hoặc mã PIN không chính xác";
