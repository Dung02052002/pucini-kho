import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  TASK_STATUSES,
  TASK_TYPES,
  type TaskStatus,
  type TaskType,
} from "../../shared/constants";
import { kvDocuments } from "./kv-documents";
import { locationItems } from "./location-items";
import { pickBatches } from "./pick-batches";
import { shelfMovements } from "./shelf-movements";
import { users } from "./users";

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: TASK_TYPES }).$type<TaskType>().notNull(),
    locationItemId: integer("location_item_id")
      .notNull()
      .references(() => locationItems.id),
    qty: integer("qty"),
    assignedTo: integer("assigned_to").references(() => users.id),
    sourceDocId: integer("source_doc_id").references(() => kvDocuments.id),
    batchId: integer("batch_id").references(() => pickBatches.id),
    reason: text("reason"),
    status: text("status", { enum: TASK_STATUSES })
      .$type<TaskStatus>()
      .notNull(),
    dueDate: text("due_date"),
    createdAt: text("created_at").notNull(),
    doneAt: text("done_at"),
  },
  (table) => [index("idx_tasks_open").on(table.status, table.assignedTo)],
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  locationItem: one(locationItems, {
    fields: [tasks.locationItemId],
    references: [locationItems.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  sourceDoc: one(kvDocuments, {
    fields: [tasks.sourceDocId],
    references: [kvDocuments.id],
  }),
  batch: one(pickBatches, {
    fields: [tasks.batchId],
    references: [pickBatches.id],
  }),
  movements: many(shelfMovements),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
