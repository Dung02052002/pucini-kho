import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { MATCH_TYPES, type MatchType } from "../../shared/constants";
import { kvDocuments } from "./kv-documents";
import { pickBatches } from "./pick-batches";
import { users } from "./users";

export const batchDocLinks = sqliteTable(
  "batch_doc_links",
  {
    batchId: integer("batch_id")
      .notNull()
      .references(() => pickBatches.id, { onDelete: "cascade" }),
    docId: integer("doc_id")
      .notNull()
      .references(() => kvDocuments.id, { onDelete: "cascade" }),
    matchType: text("match_type", { enum: MATCH_TYPES })
      .$type<MatchType>()
      .notNull(),
    score: real("score"),
    linkedBy: integer("linked_by").references(() => users.id),
    linkedAt: text("linked_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.batchId, table.docId] })],
);

export const batchDocLinksRelations = relations(batchDocLinks, ({ one }) => ({
  batch: one(pickBatches, {
    fields: [batchDocLinks.batchId],
    references: [pickBatches.id],
  }),
  document: one(kvDocuments, {
    fields: [batchDocLinks.docId],
    references: [kvDocuments.id],
  }),
  linker: one(users, {
    fields: [batchDocLinks.linkedBy],
    references: [users.id],
  }),
}));

export type BatchDocLink = typeof batchDocLinks.$inferSelect;
export type NewBatchDocLink = typeof batchDocLinks.$inferInsert;
