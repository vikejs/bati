/*# BATI include-if-imported #*/

import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import { enhance, type UniversalHandler } from "@universal-middleware/core";

export const createTodoHandler: UniversalHandler<
  Universal.Context &
    BATI.If<{
      'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
      'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
      'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
      "BATI.hasD1": { db: D1Database };
      _: object;
    }>
> = enhance(
  async (request, _context, _runtime) => {
    // In a real case, user-provided data should ALWAYS be validated with tools like zod
    const newTodo = (await request.json()) as { text: string };

    if (BATI.has("drizzle")) {
      await drizzleQueries.insertTodo(_context.db, newTodo.text);
    } else if (BATI.has("sqlite") && !BATI.hasD1) {
      sqliteQueries.insertTodo(_context.db, newTodo.text);
    } else if (BATI.hasD1) {
      await d1Queries.insertTodo(_context.db, newTodo.text);
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
  },
  { name: "my-app:todo-handler", path: `/api/todo/create`, method: ["GET", "POST"], immutable: false },
);
