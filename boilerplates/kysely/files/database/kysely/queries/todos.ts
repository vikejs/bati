import type { dbKysely, dbKyselyD1, dbKyselyPostgres } from "../db";

export async function insertTodo(
  db: $$.If<{
    '$$.BATI.has("postgres")': ReturnType<typeof dbKyselyPostgres>;
    "!$$.BATI.hasD1": ReturnType<typeof dbKysely>;
    "$$.BATI.hasD1": ReturnType<typeof dbKyselyD1>;
  }>,
  text: string,
) {
  return await db.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
}

export async function getAllTodos(
  db: $$.If<{
    '$$.BATI.has("postgres")': ReturnType<typeof dbKyselyPostgres>;
    "!$$.BATI.hasD1": ReturnType<typeof dbKysely>;
    "$$.BATI.hasD1": ReturnType<typeof dbKyselyD1>;
  }>,
) {
  return await db.selectFrom("todos").selectAll().execute();
}
