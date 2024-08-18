import { drizzleDb } from "@batijs/drizzle/database/drizzleDb";
import { todoTable } from "@batijs/drizzle/database/schema/todos";

export async function createTodoHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await drizzleDb.insert(todoTable).values({ text: newTodo.text });
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
}
