// We use Telefunc (https://telefunc.com) for data mutations. Being able to use Telefunc for fetching initial data is work-in-progress (https://vike.dev/data-fetching#tools).

import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
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
    // NOTE: This telefunction is only for demonstration — it doesn't actually save changes to a database.
    // Go to https://vike.dev/new and select a database to scaffold an app with a persisted to-list.
    console.log(`Received ${text}`);
  }
}
