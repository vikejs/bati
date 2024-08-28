import { db } from "@batijs/drizzle/database/drizzle/db";
import { todoTable } from "@batijs/drizzle/database/drizzle/schema/todos";
import type { Get, UniversalHandler } from "@universal-middleware/core";

export const createTodoHandler: Get<[], UniversalHandler> = () => async (request) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await db().insert(todoTable).values({ text: newTodo.text });
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
