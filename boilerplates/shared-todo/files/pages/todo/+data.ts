// https://vike.dev/data
import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { todoItems } from "@batijs/shared-db/database/todoItems";

export type Data = { text: string }[];

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    return db.select().from(todoTable).all();
  } else {
    const todoItemsInitial = todoItems;
    return todoItemsInitial;
  }
}
