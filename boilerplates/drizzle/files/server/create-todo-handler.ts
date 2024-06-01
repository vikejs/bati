import { db } from "../database/db";
import { todoTable, type TodoInsert } from "../database/schema";

export async function createTodoHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  const newTodo = (await request.json()) as TodoInsert;
  const result = await db.insert(todoTable).values({ text: newTodo.text });

  return new Response(JSON.stringify({ message: "New Todo Created", result }), {
    status: 201,
    headers: {
      "content-type": "application/json",
    },
  });
}
