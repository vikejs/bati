// We use Telefunc (https://telefunc.com) for data mutations. Being able to use Telefunc for fetching initial data is work-in-progress (https://vike.dev/data-fetching#tools).

import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import { todos } from "@batijs/shared-no-db/database/todoItems";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
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
  } else {
    todos.push({ text });
  }
}
