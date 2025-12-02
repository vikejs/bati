import { dbKysely, dbKyselyD1 } from "../db";

//# !BATI.hasD1
export async function insertTodo(db: ReturnType<typeof dbKysely>, text: string) {
  //# !BATI.hasD1
  return await db.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
//# !BATI.hasD1
}

//# !BATI.hasD1
export async function getAllTodos(db: ReturnType<typeof dbKysely>) {
  //# !BATI.hasD1
  return await db.selectFrom("todos").selectAll().execute();
//# !BATI.hasD1
}

//# BATI.hasD1
export async function insertTodo(db: D1Database, text: string) {
  //# BATI.hasD1
  const kyselyDb = dbKyselyD1(db);
  //# BATI.hasD1
  return await kyselyDb.insertInto("todos").values({ text }).returningAll().executeTakeFirstOrThrow();
//# BATI.hasD1
}

//# BATI.hasD1
export async function getAllTodos(db: D1Database) {
  //# BATI.hasD1
  const kyselyDb = dbKyselyD1(db);
  //# BATI.hasD1
  return await kyselyDb.selectFrom("todos").selectAll().execute();
//# BATI.hasD1
}
