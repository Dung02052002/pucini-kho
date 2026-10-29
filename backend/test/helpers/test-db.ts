import initSql from "../../migrations/0000_init.sql?raw";
import addRateLimitsSql from "../../migrations/0001_add_rate_limits.sql?raw";
import { getDb } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import type { Bindings } from "../../src/env";
import { hashPin } from "../../src/lib/crypto";
import { addHours, nowUtc } from "../../src/lib/time";

/** Toàn bộ migration theo đúng thứ tự — thêm migration mới vào cuối danh sách */
const MIGRATIONS = [initSql, addRateLimitsSql];

export const TEST_PIN_STAFF = "123456";
export const TEST_PIN_ADMIN = "admin12345";

export async function executeRawStatements(
  d1: D1Database,
  sqlContent: string,
  delimiter = "--> statement-breakpoint",
) {
  const cleanSql = sqlContent.replace(/--.*$/gm, "");
  const stmts = cleanSql
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of stmts) {
    await d1.prepare(stmt).run();
  }
}

export async function setupTestDatabase(bindings: Bindings) {
  const d1 = bindings.DB;
  const db = getDb(bindings);

  // 1. Apply migrations
  for (const migrationSql of MIGRATIONS) {
    await executeRawStatements(d1, migrationSql, "--> statement-breakpoint");
  }

  // 2. Clear previous data if any
  await d1.prepare("DELETE FROM sessions").run();
  await d1.prepare("DELETE FROM user_permissions").run();
  await d1.prepare("DELETE FROM users").run();

  // 3. Seed users with real PBKDF2 hashes
  const adminHash = await hashPin(TEST_PIN_ADMIN, 5000);
  const staffHash = await hashPin(TEST_PIN_STAFF, 5000);

  const now = nowUtc();
  const lockedUntil = addHours(1);

  // Insert Admin
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      id: 1,
      username: "admin",
      fullName: "Quản trị viên Kho",
      pinHash: adminHash,
      role: "ADMIN",
      active: 1,
      failedAttempts: 0,
      createdAt: now,
    })
    .returning();

  // Insert Staff 1 (has PICK, RETURN, REFILL)
  const [staff1] = await db
    .insert(schema.users)
    .values({
      id: 2,
      username: "nhanvien1",
      fullName: "Nguyễn Văn An",
      pinHash: staffHash,
      role: "STAFF",
      active: 1,
      failedAttempts: 0,
      createdAt: now,
    })
    .returning();

  await db.insert(schema.userPermissions).values([
    { userId: staff1.id, perm: "PICK" },
    { userId: staff1.id, perm: "RETURN" },
    { userId: staff1.id, perm: "REFILL" },
  ]);

  // Insert Staff 2 (has PICK, RETURN, COUNT)
  const [staff2] = await db
    .insert(schema.users)
    .values({
      id: 3,
      username: "nhanvien2",
      fullName: "Trần Thị Bình",
      pinHash: staffHash,
      role: "STAFF",
      active: 1,
      failedAttempts: 0,
      createdAt: now,
    })
    .returning();

  await db.insert(schema.userPermissions).values([
    { userId: staff2.id, perm: "PICK" },
    { userId: staff2.id, perm: "RETURN" },
    { userId: staff2.id, perm: "COUNT" },
  ]);

  // Insert Locked User
  await db.insert(schema.users).values({
    id: 4,
    username: "locked_user",
    fullName: "Tài khoản bị khóa",
    pinHash: staffHash,
    role: "STAFF",
    active: 1,
    failedAttempts: 5,
    lockedUntil,
    createdAt: now,
  });

  // Insert Inactive User
  await db.insert(schema.users).values({
    id: 5,
    username: "inactive_user",
    fullName: "Tài khoản ngưng hoạt động",
    pinHash: staffHash,
    role: "STAFF",
    active: 0,
    failedAttempts: 0,
    createdAt: now,
  });

  return { adminUser, staff1, staff2, db, d1 };
}

/**
 * Tạo 1 user STAFF riêng cho từng test (tránh các test khóa tài khoản ảnh hưởng lẫn nhau).
 */
export async function createStaffUser(
  bindings: Bindings,
  values: {
    id: number;
    username: string;
    pin?: string;
    failedAttempts?: number;
    lockedUntil?: string | null;
  },
) {
  const db = getDb(bindings);
  const [user] = await db
    .insert(schema.users)
    .values({
      id: values.id,
      username: values.username,
      fullName: values.username,
      pinHash: await hashPin(values.pin ?? TEST_PIN_STAFF, 5000),
      role: "STAFF",
      active: 1,
      failedAttempts: values.failedAttempts ?? 0,
      lockedUntil: values.lockedUntil ?? null,
      createdAt: nowUtc(),
    })
    .returning();
  return user;
}
