import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch";
import { contract } from "../ts-rest/contract";
// TODO: stop using universal-middleware and directly integrate server middlewares instead and/or use vike-server https://vike.dev/server. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import { Get, UniversalHandler } from "@universal-middleware/core";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import type { D1Database } from "@cloudflare/workers-types";
import { dbKysely } from "@batijs/kysely/database/kysely/db";
import * as kyselyQueries from "@batijs/kysely/database/kysely/queries/todos";

/**
 * ts-rest route
 *
 * @link {@see https://ts-rest.com/docs/serverless/fetch-runtimes/}
 **/
const router = tsr
  .platformContext<
    BATI.If<{
      'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
      'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
      'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
      'BATI.has("kysely")': { db: typeof dbKysely };
      "BATI.hasD1": { db: D1Database };
      _: object;
    }>
  >()
  .router(contract, {
    demo: async () => {
      return {
        status: 200,
        body: {
          demo: true,
        },
      };
    },
    createTodo: async ({ body }, _ctx) => {
      if (BATI.has("drizzle")) {
        await drizzleQueries.insertTodo(_ctx.db, body.text);
      } else if (BATI.has("sqlite") && !BATI.hasD1) {
        sqliteQueries.insertTodo(_ctx.db, body.text);
      } else if (BATI.hasD1) {
        await d1Queries.insertTodo(_ctx.db, body.text);
      } else if (BATI.has("kysely")) {
        await kyselyQueries.insertTodo(_ctx.db, body.text);
      } else {
        // This is where you'd persist the data
        console.log("Received new todo", { text: body.text });
      }
      return {
        status: 200,
        body: {
          status: "Ok",
        },
      };
    },
  });

export const tsRestHandler: Get<[], UniversalHandler> = () => async (request, ctx, runtime) =>
  fetchRequestHandler({
    request: new Request(request.url, request),
    contract,
    router,
    options: {},
    platformContext: {
      ...ctx,
      ...runtime,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
