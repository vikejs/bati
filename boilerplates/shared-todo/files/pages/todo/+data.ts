// https://vike.dev/data
import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { lowDb } from "@batijs/shared-no-db/database/todoItems";

export type Data = { text: string }[];

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    return db.select().from(todoTable).all();
  } else {
    lowDb.read();
    return lowDb.data.todo;
  }
}
