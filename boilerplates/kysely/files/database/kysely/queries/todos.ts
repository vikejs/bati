import type { dbKysely, dbKyselyD1 } from "../db";

export async function insertTodo(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbKysely>;
    "BATI.hasD1": ReturnType<typeof dbKyselyD1>;
  }>,
  text: string,
) {
  return await db.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
}

export async function getAllTodos(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbKysely>;
    "BATI.hasD1": ReturnType<typeof dbKyselyD1>;
  }>,
) {
  return await db.selectFrom("todos").selectAll().execute();
}
