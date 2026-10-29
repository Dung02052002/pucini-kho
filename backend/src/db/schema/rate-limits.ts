import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Bộ đếm rate limit theo cửa sổ thời gian cố định (fixed window).
 * Mỗi khóa (vd: "login:<ip>") chỉ có 1 dòng, được ghi đè khi sang cửa sổ mới
 * nên số dòng không tăng theo thời gian.
 */
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: text("window_start").notNull(), // ISO-8601 UTC, mốc bắt đầu cửa sổ hiện tại
  count: integer("count").notNull(),
});

export type RateLimitRow = typeof rateLimits.$inferSelect;
export type NewRateLimitRow = typeof rateLimits.$inferInsert;
