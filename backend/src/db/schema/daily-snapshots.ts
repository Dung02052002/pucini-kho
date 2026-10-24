import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { products } from "./products";

export const dailySnapshots = sqliteTable(
  "daily_snapshots",
  {
    date: text("date").notNull(), // YYYY-MM-DD theo giờ Việt Nam
    productId: integer("product_id").notNull(),
    kvOnHand: real("kv_on_hand").notNull(),
    shelfQty: integer("shelf_qty").notNull(),
  },
  (table) => [primaryKey({ columns: [table.date, table.productId] })],
);

export const dailySnapshotsRelations = relations(dailySnapshots, ({ one }) => ({
  product: one(products, {
    fields: [dailySnapshots.productId],
    references: [products.kvId],
  }),
}));

export type DailySnapshot = typeof dailySnapshots.$inferSelect;
export type NewDailySnapshot = typeof dailySnapshots.$inferInsert;
