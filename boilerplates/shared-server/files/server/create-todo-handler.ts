import type { Get, UniversalHandler } from "@universal-middleware/core";
import { insertTodo } from "@batijs/drizzle/database/drizzle/queries/todos";

export const createTodoHandler: Get<[], UniversalHandler> = () => async (request) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await insertTodo(newTodo.text);
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
