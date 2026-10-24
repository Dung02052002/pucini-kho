import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { locations } from "./locations";
import { products } from "./products";
import { shelfMovements } from "./shelf-movements";
import { tasks } from "./tasks";

export const locationItems = sqliteTable(
  "location_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.kvId),
    minQty: integer("min_qty").notNull().default(0),
    maxQty: integer("max_qty"),
    qtyCached: integer("qty_cached").notNull().default(0),
    lastCountedAt: text("last_counted_at"),
    active: integer("active").notNull().default(1),
  },
  (table) => [
    unique("uq_location_items_loc_prod").on(table.locationId, table.productId),
    index("idx_li_product").on(table.productId),
  ],
);

export const locationItemsRelations = relations(
  locationItems,
  ({ one, many }) => ({
    location: one(locations, {
      fields: [locationItems.locationId],
      references: [locations.id],
    }),
    product: one(products, {
      fields: [locationItems.productId],
      references: [products.kvId],
    }),
    movements: many(shelfMovements),
    tasks: many(tasks),
  }),
);

export type LocationItem = typeof locationItems.$inferSelect;
export type NewLocationItem = typeof locationItems.$inferInsert;
