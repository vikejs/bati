import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await drizzleQueries.insertTodo(text);
  } else if (BATI.has("sqlite")) {
    sqliteQueries.insertTodo(text);
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
