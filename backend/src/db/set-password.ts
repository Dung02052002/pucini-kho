/**
 * Đặt lại mã PIN / mật khẩu cho 1 user có sẵn trong D1.
 *
 * Cách dùng:
 *   npm run user:password -- <username> --remote   (D1 production)
 *   npm run user:password -- <username>            (D1 local, mặc định)
 *
 * Script hỏi mật khẩu 2 lần (gõ hiện dấu *), băm PBKDF2 rồi ghi thẳng vào DB.
 * Đồng thời: mở khóa tài khoản (reset số lần sai) và đăng xuất mọi phiên cũ của user.
 */
import { randomUUID } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { hashPin } from "../lib/crypto";
import { D1_DATABASE_NAME, executeD1File } from "./wrangler-d1";

/** Spec §11: STAFF dùng PIN 6 số, ADMIN dùng mật khẩu ≥ 10 ký tự → tối thiểu chung là 6 */
const MIN_PASSWORD_LENGTH = 6;
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

/**
 * Tạo hàm hỏi mật khẩu, ẩn ký tự người dùng gõ (hiện "*").
 *
 * Đọc từng dòng qua async iterator của 1 readline dùng chung: các dòng đến sớm
 * (khi chạy qua pipe trong CI/test) được xếp hàng chờ thay vì bị mất như khi dùng
 * rl.question() hay tạo nhiều readline.
 */
function createHiddenPrompt() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? false,
  });
  const lines = rl[Symbol.asyncIterator]();

  // readline không có tùy chọn ẩn input → mọi thứ readline in ra (ký tự vừa gõ) đổi thành "*"
  const writer = rl as unknown as { _writeToOutput: (text: string) => void };
  writer._writeToOutput = (text) => {
    if (!/[\r\n]/.test(text)) process.stdout.write("*");
  };

  return {
    async ask(question: string): Promise<string> {
      process.stdout.write(question);
      const { value, done } = await lines.next();
      process.stdout.write("\n");
      if (done) {
        throw new Error("Không nhận được dữ liệu nhập (stdin đã đóng).");
      }
      return value;
    },
    close: () => rl.close(),
  };
}

/**
 * Dừng script với thông báo lỗi. Dùng throw (không process.exit) để các khối
 * finally vẫn chạy — vd: xóa file tạm chứa hash.
 */
function fail(message: string): never {
  throw new Error(message);
}

/** Escape chuỗi để nhúng an toàn vào SQL trong nháy đơn */
function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function main(): Promise<void> {
  const args: string[] = process.argv.slice(2);
  const isRemote = args.includes("--remote");
  const username = args.find((arg) => !arg.startsWith("--"));

  if (!username || !USERNAME_PATTERN.test(username)) {
    fail(
      "Thiếu hoặc sai username. Ví dụ: npm run user:password -- admin --remote",
    );
  }

  const target = isRemote ? "PRODUCTION (--remote)" : "local";
  console.log(`Đặt lại mật khẩu cho "${username}" trên D1 ${target}`);

  const prompt = createHiddenPrompt();
  const password = await prompt.ask("Mật khẩu mới: ");
  const confirm = await prompt.ask("Nhập lại mật khẩu: ");
  prompt.close();

  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  }
  if (confirm !== password) {
    fail("Hai lần nhập không khớp.");
  }

  const user = sqlString(username);
  const hash = sqlString(await hashPin(password));

  // Câu 1: cập nhật hash + mở khóa.
  // Câu 2: thu hồi mọi phiên cũ (bắt đăng nhập lại bằng mật khẩu mới).
  // Câu 3: xác nhận user đã mang hash mới — không dựa vào meta.changes vì
  //        wrangler --local không trả trường này.
  const sql = [
    `UPDATE users SET pin_hash = ${hash}, failed_attempts = 0, locked_until = NULL WHERE username = ${user};`,
    `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = ${user});`,
    `SELECT COUNT(*) AS updated FROM users WHERE username = ${user} AND pin_hash = ${hash};`,
  ].join("\n");

  // File tạm chứa hash → luôn xóa sau khi chạy, kể cả khi lỗi
  const sqlFile = join(tmpdir(), `kho-set-password-${randomUUID()}.sql`);
  let isUpdated = false;
  try {
    writeFileSync(sqlFile, sql, "utf8");
    const results = executeD1File(sqlFile, isRemote);
    const [check] = (results.at(-1)?.results ?? []) as { updated: number }[];
    isUpdated = check?.updated === 1;
  } finally {
    rmSync(sqlFile, { force: true });
  }

  if (!isUpdated) {
    fail(`Không tìm thấy user "${username}" trong D1 ${D1_DATABASE_NAME}.`);
  }

  console.log(
    `✔ Đã đặt lại mật khẩu cho "${username}", mở khóa và đăng xuất các phiên cũ.`,
  );
}

main().catch((error: unknown) => {
  console.error(`✘ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
