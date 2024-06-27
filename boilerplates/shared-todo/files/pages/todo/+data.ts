// https://vike.dev/data
import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { todos } from "@batijs/shared-no-db/database/todoItems";

export type Data = {
  todo: { text: string }[];
};

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = db.select().from(todoTable).all();

    return { todo };
  } else {
    return todos;
  }
}
