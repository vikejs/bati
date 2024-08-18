import { drizzleDb } from "@batijs/drizzle/database/drizzleDb";
import { todoTable } from "@batijs/drizzle/database/schema/todos";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await drizzleDb.insert(todoTable).values({ text });
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
