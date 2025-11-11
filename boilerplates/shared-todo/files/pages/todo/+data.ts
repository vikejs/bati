// https://vike.dev/data

import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(_pageContext: PageContextServer) {
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
    // NOTE: This +data hook is only for demonstration — it doesn't actually retreive data from a database.
    // Go to https://vike.dev/new and select a database to scaffold an app with a persisted to-list.
    return { todo: [{ text: "Buy milk" }, { text: "Buy strawberries" }] };
  }
}
