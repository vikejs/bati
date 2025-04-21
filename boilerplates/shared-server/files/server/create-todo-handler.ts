/*# BATI include-if-imported #*/
// TODO: stop using universal-middleware and directly integrate server middlewares instead and/or use vike-server https://vike.dev/server. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import type { Get, UniversalHandler } from "@universal-middleware/core";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as kyselyQueries from "@batijs/kysely/database/kysely/queries/todos";
import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import type { dbKysely } from "@batijs/kysely/database/kysely/db";
import type { D1Database } from "@cloudflare/workers-types";

export const createTodoHandler: Get<
  [],
  UniversalHandler<
    Universal.Context &
      BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
        'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
        'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
        'BATI.has("kysely")': { db: typeof dbKysely };
        "BATI.hasD1": { db: D1Database };
        _: object;
      }>
  >
> = () => async (request, _context, _runtime) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  if (BATI.has("drizzle")) {
    await drizzleQueries.insertTodo(_context.db, newTodo.text);
  } else if (BATI.has("sqlite") && !BATI.hasD1) {
    sqliteQueries.insertTodo(_context.db, newTodo.text);
  } else if (BATI.hasD1) {
    await d1Queries.insertTodo(_context.db, newTodo.text);
  } else if (BATI.has("kysely")) {
    await kyselyQueries.insertTodo(_context.db, newTodo.text);
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", newTodo);
  }

  return new Response(JSON.stringify({ status: "OK" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};
