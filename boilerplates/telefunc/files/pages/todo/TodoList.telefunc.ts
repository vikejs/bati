// We use Telefunc (https://telefunc.com) for data mutations. Being able to use Telefunc for fetching initial data is work-in-progress (https://vike.dev/data-fetching#tools).

import { todos } from "@batijs/shared-no-db/database/todoItems";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import * as kyselyQueries from "@batijs/kysely/database/kysely/queries/todos";
import { getContext } from "telefunc";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    const context = getContext();
    await drizzleQueries.insertTodo(context.db, text);
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    const context = getContext();
    sqliteQueries.insertTodo(context.db, text);
  } else if (BATI.hasD1) {
    const context = getContext();
    await d1Queries.insertTodo(context.db, text);
  } else if (BATI.has("kysely")) {
    const context = getContext();
    await kyselyQueries.insertTodo(context.db, text);
  } else {
    todos.push({ text });
  }
}
