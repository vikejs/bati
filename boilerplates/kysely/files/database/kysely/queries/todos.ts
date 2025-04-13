import { dbKysely } from "../db";

export async function insertTodo(db: typeof dbKysely, text: string) {
  return await db.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
}

export async function getAllTodos(db: typeof dbKysely) {
  return await db.selectFrom("todos").selectAll().execute();
}
