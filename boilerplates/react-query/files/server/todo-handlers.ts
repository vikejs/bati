import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import type { dbKysely, dbKyselyD1 } from "@batijs/kysely/database/kysely/db";
import * as kyselyQueries from "@batijs/kysely/database/kysely/queries/todos";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import { enhance, type UniversalHandler } from "@universal-middleware/core";

export const getTodosHandler: UniversalHandler<
  Universal.Context &
    BATI.If<{
      'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
      'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
      'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
      'BATI.has("kysely") && !BATI.hasD1': { db: ReturnType<typeof dbKysely> };
      'BATI.has("kysely")': { db: ReturnType<typeof dbKyselyD1> };
      "BATI.hasD1": { db: D1Database };
      _: object;
    }>
> = enhance(
  async (_request, _context, _runtime) => {
    let todoItems: { text: string }[];

    if (BATI.has("drizzle")) {
      todoItems = await drizzleQueries.getAllTodos(_context.db);
    } else if (BATI.has("sqlite") && !BATI.hasD1) {
      todoItems = sqliteQueries.getAllTodos(_context.db);
    } else if (BATI.has("kysely")) {
      todoItems = await kyselyQueries.getAllTodos(_context.db);
    } else if (BATI.hasD1) {
      todoItems = await d1Queries.getAllTodos(_context.db);
    } else {
      todoItems = [{ text: "Buy milk" }, { text: "Buy strawberries" }];
    }

    return new Response(JSON.stringify(todoItems), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  },
  {
    name: "my-app:get-todos-handler",
    path: `/api/todo`,
    method: ["GET"],
    immutable: false,
  },
);
