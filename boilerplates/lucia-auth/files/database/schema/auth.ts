import { int, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
});

export const oauthAccountTable = sqliteTable(
  "oauth_accounts",
  {
    providerId: text("provider_id").notNull(),
    providerUserId: int("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
    };
  },
);

export const sessionTable = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  expiresAt: integer("expires_at").notNull(),
});

export type UserItem = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
