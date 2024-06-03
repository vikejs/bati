import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { todoItems } from "@batijs/shared-todo/database/todoItems";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await db.insert(todoTable).values({ text });
  } else {
    todoItems.push({ text });
  }
}
