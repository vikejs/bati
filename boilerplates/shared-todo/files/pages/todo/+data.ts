// https://vike.dev/data
import { drizzleDb } from "@batijs/drizzle/database/drizzleDb";
import { todoTable } from "@batijs/drizzle/database/schema/todos";
import { todos } from "@batijs/shared-no-db/database/todoItems";

export type Data = {
  todo: { text: string }[];
};

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = drizzleDb.select().from(todoTable).all();

    return { todo };
  } else {
    return todos;
  }
}
