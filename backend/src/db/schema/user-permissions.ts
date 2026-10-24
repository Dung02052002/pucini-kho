import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { USER_PERMISSIONS, type UserPermission } from "../../shared/constants";
import { users } from "./users";

export const userPermissions = sqliteTable(
  "user_permissions",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    perm: text("perm", { enum: USER_PERMISSIONS })
      .$type<UserPermission>()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.perm] })],
);

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
  }),
);

export type UserPermissionRow = typeof userPermissions.$inferSelect;
export type NewUserPermissionRow = typeof userPermissions.$inferInsert;
