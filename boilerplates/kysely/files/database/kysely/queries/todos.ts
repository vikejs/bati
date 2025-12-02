import { type dbKysely, dbKyselyD1 } from "../db";

export async function insertTodo(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbKysely>;
    _: D1Database;
  }>,
  text: string,
) {
  if (BATI.hasD1) {
    const kyselyDb = dbKyselyD1(db as D1Database);
    return await kyselyDb.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
  } else {
    return await (db as ReturnType<typeof dbKysely>)
      .insertInto("todos")
      .values({ text })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

export async function getAllTodos(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbKysely>;
    _: D1Database;
  }>,
) {
  if (BATI.hasD1) {
    const kyselyDb = dbKyselyD1(db as D1Database);
    return await kyselyDb.selectFrom("todos").selectAll().execute();
  } else {
    return await (db as ReturnType<typeof dbKysely>).selectFrom("todos").selectAll().execute();
  }
}
