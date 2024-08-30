// https://vike.dev/data
import { todos } from "@batijs/shared-no-db/database/todoItems";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1/database/d1/queries/todos";
import type { PageContextServer } from "vike/types";

export type Data = {
  todo: { text: string }[];
};

export default async function data(_pageContext: PageContextServer): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = drizzleQueries.getAllTodos();

    return { todo };
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    const todo = sqliteQueries.getAllTodos();

    return { todo };
  } else if (BATI.hasD1) {
    const todo = await d1Queries.getAllTodos(_pageContext.env.DB);

    return { todo };
  } else {
    return todos;
  }
}
