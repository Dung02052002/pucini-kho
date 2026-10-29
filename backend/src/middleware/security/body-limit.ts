import type { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AppEnv } from "../../env";
import { PayloadTooLargeError } from "../../lib/errors";

/** Giới hạn mặc định cho request JSON. Route cần lớn hơn (import file) tự gắn bodyLimitMiddleware riêng. */
export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

/**
 * Chặn request body quá lớn trước khi parse, trả lỗi 413 theo format chuẩn.
 */
export function bodyLimitMiddleware(
  maxSize = DEFAULT_MAX_BODY_BYTES,
): MiddlewareHandler<AppEnv> {
  return bodyLimit({
    maxSize,
    onError: () => {
      throw new PayloadTooLargeError(undefined, { maxBytes: maxSize });
    },
  });
}
