import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  BATCH_PURPOSES,
  BATCH_STATUSES,
  type BatchPurpose,
  type BatchStatus,
} from "../../shared/constants";
import { batchDocLinks } from "./batch-doc-links";
import { branches } from "./branches";
import { shelfMovements } from "./shelf-movements";
import { tasks } from "./tasks";
import { users } from "./users";

export const pickBatches = sqliteTable("pick_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. S-0124
  purpose: text("purpose", { enum: BATCH_PURPOSES })
    .$type<BatchPurpose>()
    .notNull(),
  toBranchId: integer("to_branch_id").references(() => branches.kvId),
  status: text("status", { enum: BATCH_STATUSES })
    .$type<BatchStatus>()
    .notNull(),
  note: text("note"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const pickBatchesRelations = relations(pickBatches, ({ one, many }) => ({
  toBranch: one(branches, {
    fields: [pickBatches.toBranchId],
    references: [branches.kvId],
  }),
  creator: one(users, {
    fields: [pickBatches.createdBy],
    references: [users.id],
  }),
  movements: many(shelfMovements),
  docLinks: many(batchDocLinks),
  tasks: many(tasks),
}));

export type PickBatch = typeof pickBatches.$inferSelect;
export type NewPickBatch = typeof pickBatches.$inferInsert;
