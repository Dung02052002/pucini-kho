import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
} from "drizzle-orm/sqlite-core";
import { kvDocuments } from "./kv-documents";
import { products } from "./products";

export const kvDocumentLines = sqliteTable(
  "kv_document_lines",
  {
    docId: integer("doc_id")
      .notNull()
      .references(() => kvDocuments.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    qty: real("qty").notNull(),
    prevQty: real("prev_qty"), // Số lượng ở lần sync trước
  },
  (table) => [primaryKey({ columns: [table.docId, table.productId] })],
);

export const kvDocumentLinesRelations = relations(
  kvDocumentLines,
  ({ one }) => ({
    document: one(kvDocuments, {
      fields: [kvDocumentLines.docId],
      references: [kvDocuments.id],
    }),
    product: one(products, {
      fields: [kvDocumentLines.productId],
      references: [products.kvId],
    }),
  }),
);

export type KvDocumentLine = typeof kvDocumentLines.$inferSelect;
export type NewKvDocumentLine = typeof kvDocumentLines.$inferInsert;
