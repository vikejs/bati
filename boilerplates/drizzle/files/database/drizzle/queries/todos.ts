/*# BATI include-if-imported #*/

import type { dbD1, dbSqlite } from "../db";
import { todoTable } from "../schema/todos";

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
