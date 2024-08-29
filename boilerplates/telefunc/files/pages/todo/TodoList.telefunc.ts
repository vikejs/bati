import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1/database/d1/queries/todos";
import { getContext } from "telefunc";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await drizzleQueries.insertTodo(text);
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    sqliteQueries.insertTodo(text);
  } else if (BATI.hasD1) {
    const context = getContext();
    await d1Queries.insertTodo(context.env.DB, text);
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
