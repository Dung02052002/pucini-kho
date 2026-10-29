import { execSync } from "node:child_process";
import { resolve } from "node:path";

export const SEED_SQL_PATH = resolve(process.cwd(), "src/db/seed.sql");

export function runSeed(isRemote = false) {
  const targetFlag = isRemote ? "--remote" : "--local";
  console.log(`[Seed] Bắt đầu nạp dữ liệu mẫu vào D1 (${targetFlag})...`);

  try {
    const cmd = `npx wrangler d1 execute kho-ql ${targetFlag} --file="${SEED_SQL_PATH}"`;
    execSync(cmd, { stdio: "inherit" });
    console.log("[Seed] Hoàn tất nạp dữ liệu mẫu thành công!");
  } catch (err) {
    console.error("[Seed] Lỗi khi nạp dữ liệu mẫu:", err);
    process.exit(1);
  }
}

// Chạy trực tiếp qua `npm run db:seed`
if (process.argv[1]?.includes("seed.ts")) {
  const isRemote = process.argv.includes("--remote");
  runSeed(isRemote);
}
