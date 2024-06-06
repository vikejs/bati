import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { lowDb } from "@batijs/shared-no-db/database/todoItems";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await db.insert(todoTable).values({ text });
  } else {
    await lowDb.update(({ todo }) => todo.push({ text }));
  }
}
