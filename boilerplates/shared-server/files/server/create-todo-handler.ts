/*# BATI include-if-imported #*/
import type { Get, UniversalHandler } from "@universal-middleware/core";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1/database/d1/queries/todos";
import { getDbFromRuntime } from "@batijs/d1/database/d1/helpers";

export const createTodoHandler: Get<[], UniversalHandler> = () => async (request, _ctx, _runtime) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await drizzleQueries.insertTodo(newTodo.text);
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    sqliteQueries.insertTodo(newTodo.text);
  } else if (BATI.hasD1) {
    await d1Queries.insertTodo(getDbFromRuntime(_runtime), newTodo.text);
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", newTodo);
  }

  return new Response(JSON.stringify({ status: "OK" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};
