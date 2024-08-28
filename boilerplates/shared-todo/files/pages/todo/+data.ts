// https://vike.dev/data
import { todos } from "@batijs/shared-no-db/database/todoItems";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";

export type Data = {
  todo: { text: string }[];
};

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = drizzleQueries.getAllTodos();

    return { todo };
  } else if (BATI.has("sqlite")) {
    const todo = sqliteQueries.getAllTodos();

    return { todo };
  } else {
    return todos;
  }
}
