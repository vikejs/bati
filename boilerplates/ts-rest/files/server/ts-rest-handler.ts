import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch";
import { contract } from "../ts-rest/contract";
import { Get, UniversalHandler } from "@universal-middleware/core";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1/database/d1/queries/todos";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * ts-rest route
 *
 * @link {@see https://ts-rest.com/docs/serverless/fetch-runtimes/}
 **/
const router = ((BATI.hasD1 ? tsr.platformContext<{ env: { DB: D1Database } }>() : tsr) as BATI.Any).router(contract, {
  demo: async () => {
    return {
      status: 200,
      body: {
        demo: true,
      },
    };
  },
  createTodo: async (
    { body },
    //# BATI.hasD1
    ctx,
  ) => {
    if (BATI.has("drizzle")) {
      await drizzleQueries.insertTodo(body.text);
    } else if (BATI.has("sqlite") && !BATI.hasD1) {
      sqliteQueries.insertTodo(body.text);
    } else if (BATI.hasD1) {
      await d1Queries.insertTodo(ctx.env.DB, body.text);
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
