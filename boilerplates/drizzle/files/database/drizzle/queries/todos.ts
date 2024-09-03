/*# BATI include-if-imported #*/
import { todoTable } from "../schema/todos";
import { dbD1, type dbSqlite } from "../db";

export function insertTodo(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  text: string,
) {
  return db.insert(todoTable).values({ text });
}

export function getAllTodos(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
) {
  return db.select().from(todoTable).all();
}
