import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { todoItems } from "../database/todoItems";

export async function createTodoHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await db.insert(todoTable).values({ text: newTodo.text });
  } else {
    todoItems.push({ text: newTodo.text });
  }

  return new Response(JSON.stringify({ status: "OK" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}
