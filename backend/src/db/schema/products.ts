import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { locationItems } from "./location-items";

export const products = sqliteTable(
  "products",
  {
    kvId: integer("kv_id").primaryKey(),
    code: text("code").notNull().unique(), // e.g. SP000117
    name: text("name").notNull(),
    category: text("category"),
    barcode: text("barcode"),
    imageUrl: text("image_url"),
    basePrice: integer("base_price"),
    kvOnHand: real("kv_on_hand").notNull().default(0),
    kvModifiedAt: text("kv_modified_at"),
    syncedAt: text("synced_at").notNull(),
  },
  (table) => [index("idx_products_barcode").on(table.barcode)],
);

export const productsRelations = relations(products, ({ many }) => ({
  locationItems: many(locationItems),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
