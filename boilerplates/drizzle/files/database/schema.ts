import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const todoTable = sqliteTable("todos", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    text: text("text", { length: 50 }).notNull()
})

export type TodoItem = typeof todoTable.$inferSelect