/*# BATI include-if-imported #*/
import type { Get, UniversalHandler } from "@universal-middleware/core";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";

export const createTodoHandler: Get<[], UniversalHandler> = () => async (request) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await drizzleQueries.insertTodo(newTodo.text);
  } else if (BATI.has("sqlite")) {
    sqliteQueries.insertTodo(newTodo.text);
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
