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
  // `db` is the engine-specific Drizzle instance; the cast bridges the dialects
  // for the demo and is removed at scaffold time.
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
  if (BATI.has("postgres")) {
    // postgres-js driver resolves the query promise directly.
    return (db as BATI.Any).select().from(todoTable);
  } else {
    return (db as BATI.Any).select().from(todoTable).all();
  }
}
