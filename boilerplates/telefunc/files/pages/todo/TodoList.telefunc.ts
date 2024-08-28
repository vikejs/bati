import { db } from "@batijs/drizzle/database/drizzle/db";
import { todoTable } from "@batijs/drizzle/database/drizzle/schema/todos";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await db().insert(todoTable).values({ text });
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
