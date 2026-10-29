/**
 * Chạy file SQL lên D1 qua Wrangler CLI — dùng cho các script quản trị chạy bằng Node (tsx),
 * KHÔNG dùng trong code Worker.
 */
import { execSync } from "node:child_process";

/** Phải trùng `database_name` trong wrangler.jsonc */
export const D1_DATABASE_NAME = "kho-ql";

export interface D1ExecuteResult {
  results: unknown[];
  success: boolean;
  /** Lưu ý: `changes` chỉ có khi chạy --remote, wrangler --local không trả về */
  meta: { changes?: number };
}

/**
 * Thực thi file SQL. Dùng `--file` (không dùng `--command`) để shell không
 * diễn giải các ký tự đặc biệt như `$` trong dữ liệu (vd: hash PBKDF2).
 *
 * @returns kết quả từng câu lệnh SQL theo thứ tự
 */
export function executeD1File(
  sqlFilePath: string,
  isRemote: boolean,
): D1ExecuteResult[] {
  const target = isRemote ? "--remote" : "--local";
  const output = execSync(
    `npx wrangler d1 execute ${D1_DATABASE_NAME} ${target} --file="${sqlFilePath}" --json`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return JSON.parse(output) as D1ExecuteResult[];
}
