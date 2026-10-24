import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { MOVEMENT_TYPES, type MovementType } from "../../shared/constants";
import { locationItems } from "./location-items";
import { pickBatches } from "./pick-batches";
import { tasks } from "./tasks";
import { users } from "./users";

export const shelfMovements = sqliteTable(
  "shelf_movements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locationItemId: integer("location_item_id")
      .notNull()
      .references(() => locationItems.id),
    type: text("type", { enum: MOVEMENT_TYPES })
      .$type<MovementType>()
      .notNull(),
    qty: integer("qty").notNull(), // có dấu: PICK < 0, RETURN/REFILL > 0, COUNT = delta
    qtyAfter: integer("qty_after").notNull(),
    countedQty: integer("counted_qty"), // Chỉ dùng khi COUNT
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    batchId: integer("batch_id").references(() => pickBatches.id),
    taskId: integer("task_id").references(() => tasks.id),
    reason: text("reason"),
    note: text("note"),
    clientUuid: text("client_uuid").notNull().unique(), // idempotency
    createdAt: text("created_at").notNull(),
    canceledAt: text("canceled_at"),
    canceledBy: integer("canceled_by").references(() => users.id),
    cancelReason: text("cancel_reason"),
  },
  (table) => [
    index("idx_mv_li_time").on(table.locationItemId, table.createdAt),
    index("idx_mv_batch").on(table.batchId),
    index("idx_mv_user_time").on(table.userId, table.createdAt),
    index("idx_mv_time").on(table.createdAt),
  ],
);

export const shelfMovementsRelations = relations(shelfMovements, ({ one }) => ({
  locationItem: one(locationItems, {
    fields: [shelfMovements.locationItemId],
    references: [locationItems.id],
  }),
  user: one(users, {
    fields: [shelfMovements.userId],
    references: [users.id],
    relationName: "userMovements",
  }),
  canceledByUser: one(users, {
    fields: [shelfMovements.canceledBy],
    references: [users.id],
    relationName: "userCanceledMovements",
  }),
  batch: one(pickBatches, {
    fields: [shelfMovements.batchId],
    references: [pickBatches.id],
  }),
  task: one(tasks, {
    fields: [shelfMovements.taskId],
    references: [tasks.id],
  }),
}));

export type ShelfMovement = typeof shelfMovements.$inferSelect;
export type NewShelfMovement = typeof shelfMovements.$inferInsert;
