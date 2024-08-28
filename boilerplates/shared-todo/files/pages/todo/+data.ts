// https://vike.dev/data
import { todos } from "@batijs/shared-no-db/database/todoItems";
import { getAllTodos } from "@batijs/drizzle/database/drizzle/queries/todos";

export type Data = {
  todo: { text: string }[];
};

export default async function data(): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = getAllTodos();

    return { todo };
  } else {
    return todos;
  }
}
