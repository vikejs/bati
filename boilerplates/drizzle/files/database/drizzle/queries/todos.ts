/*# BATI include-if-imported #*/

import type { dbD1, dbPostgres, dbSqlite } from "../db";
import { todoTable } from "../schema/todos";

export function insertTodo(
  db: BATI.If<{
    'BATI.has("postgres")': ReturnType<typeof dbPostgres>;
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  text: string,
) {
  return (db as BATI.Any).insert(todoTable).values({ text });
}

export async function getAllTodos(
  db: BATI.If<
    {
      'BATI.has("postgres")': ReturnType<typeof dbPostgres>;
      "!BATI.hasD1": ReturnType<typeof dbSqlite>;
      _: ReturnType<typeof dbD1>;
    },
    "union"
  >,
) {
  const query = (db as BATI.Any).select().from(todoTable);
  return BATI.has("postgres") ? query : query.all();
}
