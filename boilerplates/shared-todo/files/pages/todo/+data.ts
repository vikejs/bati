// https://vike.dev/data

import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import { todos } from "@batijs/shared-no-db/database/todoItems";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import type { PageContextServer } from "vike/types";

export type Data = {
  todo: { text: string }[];
};

export default async function data(_pageContext: PageContextServer): Promise<Data> {
  if (BATI.has("drizzle")) {
    const todo = await drizzleQueries.getAllTodos(_pageContext.db);

    return { todo };
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    const todo = sqliteQueries.getAllTodos(_pageContext.db);

    return { todo };
  } else if (BATI.hasD1) {
    const todo = await d1Queries.getAllTodos(_pageContext.db);

    return { todo };
  } else {
    return { todo: todos };
  }
}
