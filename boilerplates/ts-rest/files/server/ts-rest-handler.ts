import { db } from "@batijs/drizzle/database/drizzle/db";
import { todoTable } from "@batijs/drizzle/database/drizzle/schema/todos";
import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch";
import { contract } from "../ts-rest/contract";
import { Get, UniversalHandler } from "@universal-middleware/core";

/**
 * ts-rest route
 *
 * @link {@see https://ts-rest.com/docs/serverless/fetch-runtimes/}
 **/
const router = tsr.router(contract, {
  demo: async () => {
    return {
      status: 200,
      body: {
        demo: true,
      },
    };
  },
  createTodo: async ({ body }) => {
    if (BATI.has("drizzle")) {
      await db().insert(todoTable).values({ text: body.text });
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

export const tsRestHandler: Get<[], UniversalHandler> = () => async (request) =>
  fetchRequestHandler({
    request: new Request(request.url, request),
    contract,
    router,
    options: {},
  });
