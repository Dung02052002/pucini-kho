import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { KV_DOC_TYPES, type KvDocType } from "../../shared/constants";
import { batchDocLinks } from "./batch-doc-links";
import { kvDocumentLines } from "./kv-document-lines";
import { tasks } from "./tasks";

export const kvDocuments = sqliteTable(
  "kv_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kvId: integer("kv_id").notNull(),
    type: text("type", { enum: KV_DOC_TYPES }).$type<KvDocType>().notNull(),
    code: text("code").notNull(),
    status: integer("status").notNull(),
    fromBranchId: integer("from_branch_id"),
    toBranchId: integer("to_branch_id"),
    description: text("description"), // Ghi chú phiếu, bắt mã đợt "S-0124"
    docDate: text("doc_date").notNull(),
    kvModifiedAt: text("kv_modified_at"),
  },
  (table) => [unique("uq_kv_documents_type_kvid").on(table.type, table.kvId)],
);

export const kvDocumentsRelations = relations(kvDocuments, ({ many }) => ({
  lines: many(kvDocumentLines),
  batchLinks: many(batchDocLinks),
  tasks: many(tasks),
}));

export type KvDocument = typeof kvDocuments.$inferSelect;
export type NewKvDocument = typeof kvDocuments.$inferInsert;
