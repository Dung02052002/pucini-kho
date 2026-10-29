import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { D1_DATABASE_NAME } from "./wrangler-d1";

export const SEED_SQL_PATH = resolve(process.cwd(), "src/db/seed.sql");

export function runSeed(isRemote = false) {
  const targetFlag = isRemote ? "--remote" : "--local";
  console.log(`[Seed] Bắt đầu nạp dữ liệu mẫu vào D1 (${targetFlag})...`);

  try {
    const cmd = `npx wrangler d1 execute ${D1_DATABASE_NAME} ${targetFlag} --file="${SEED_SQL_PATH}"`;
    execSync(cmd, { stdio: "inherit" });
    console.log("[Seed] Hoàn tất nạp dữ liệu mẫu thành công!");
  } catch (err) {
    console.error("[Seed] Lỗi khi nạp dữ liệu mẫu:", err);
    process.exit(1);
  }
}

// Chạy trực tiếp qua `npm run db:seed`
if (process.argv[1]?.includes("seed.ts")) {
  // Seed chứa mật khẩu dev công khai và QR token cố định → tuyệt đối không nạp lên production.
  // Tạo/đặt mật khẩu user production bằng `npm run user:password -- <username> --remote`.
  if (process.argv.includes("--remote")) {
    console.error(
      "[Seed] Từ chối: dữ liệu seed chỉ dành cho D1 local (chứa mật khẩu dev công khai).",
    );
    process.exitCode = 1;
  } else {
    runSeed(false);
  }
}
