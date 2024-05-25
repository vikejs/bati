import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";

export type Data = ReturnType<typeof data>;

export default function data() {
  const todoItems = db.select().from(todoTable).all();

  return todoItems;
}
