import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { USER_ROLES, type UserRole } from "../../shared/constants";
import { batchDocLinks } from "./batch-doc-links";
import { pickBatches } from "./pick-batches";
import { sessions } from "./sessions";
import { shelfMovements } from "./shelf-movements";
import { tasks } from "./tasks";
import { userPermissions } from "./user-permissions";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  pinHash: text("pin_hash").notNull(),
  role: text("role", { enum: USER_ROLES }).$type<UserRole>().notNull(),
  active: integer("active").notNull().default(1),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
  sessions: many(sessions),
  pickBatches: many(pickBatches),
  assignedTasks: many(tasks),
  movements: many(shelfMovements, { relationName: "userMovements" }),
  canceledMovements: many(shelfMovements, {
    relationName: "userCanceledMovements",
  }),
  batchDocLinks: many(batchDocLinks),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
