import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../env";
import { API_PREFIX } from "../../shared/constants";
import { requireAuth } from "./guards";

/**
 * Danh sách DUY NHẤT các endpoint không cần đăng nhập ("METHOD path").
 * Mọi endpoint khác mặc định yêu cầu session hợp lệ (deny-by-default),
 * nên quên gắn guard ở route mới sẽ không làm lộ dữ liệu.
 *
 * Khi thêm endpoint public mới (vd: webhook), phải thêm vào đây và có cơ chế xác thực riêng.
 */
const PUBLIC_ROUTES: ReadonlySet<string> = new Set([
  `GET ${API_PREFIX}/health`,
  `POST ${API_PREFIX}/auth/login`,
]);

/** Bỏ dấu "/" cuối để "/health" và "/health/" được xử lý như nhau */
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.has(`${method.toUpperCase()} ${normalizePath(path)}`);
}

/**
 * Chặn mọi request chưa đăng nhập, trừ PUBLIC_ROUTES và preflight CORS (OPTIONS).
 * Route chưa tồn tại cũng trả 401 với người chưa đăng nhập → không lộ danh sách endpoint.
 */
export const requireAuthByDefault: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  if (c.req.method === "OPTIONS" || isPublicRoute(c.req.method, c.req.path)) {
    await next();
    return;
  }
  // Dùng await (không `return requireAuth(...)`) để lỗi 401 được bắt ngay trong
  // microtask hiện tại; nếu không workerd sẽ báo "unhandled rejection" giả.
  await requireAuth(c, next);
};
