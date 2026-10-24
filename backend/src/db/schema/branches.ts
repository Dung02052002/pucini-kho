import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pickBatches } from "./pick-batches";

export const branches = sqliteTable("branches", {
  kvId: integer("kv_id").primaryKey(),
  name: text("name").notNull(),
  active: integer("active").notNull().default(1),
  syncedAt: text("synced_at"),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  pickBatches: many(pickBatches),
}));

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
