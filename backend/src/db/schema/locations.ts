import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { locationItems } from "./location-items";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. A2-1-04 (dãy+kệ - tầng - ô)
  aisle: text("aisle").notNull(),
  rack: integer("rack").notNull(),
  level: integer("level").notNull(),
  slot: integer("slot").notNull(),
  qrToken: text("qr_token").notNull().unique(), // 8 ký tự base32
  labelPrintedAt: text("label_printed_at"),
  active: integer("active").notNull().default(1),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  items: many(locationItems),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
