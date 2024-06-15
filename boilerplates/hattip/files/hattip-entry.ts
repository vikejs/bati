// BATI.has("auth0")
import "dotenv/config";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { lowDb } from "@batijs/shared-no-db/database/todoItems";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { createTodoHandler } from "@batijs/shared-todo/server/create-todo-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import { contract } from "@batijs/ts-rest/ts-rest/contract";
import type { AdapterRequestContext, HattipHandler } from "@hattip/core";
import { createRouter, type RouteHandler } from "@hattip/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { tsr, fetchRequestHandler as tsrFetchRequestHandler } from "@ts-rest/serverless/fetch";

interface Middleware<Context extends Record<string | number | symbol, unknown>> {
  (request: Request, context: Context): Response | void | Promise<Response> | Promise<void>;
}

function handlerAdapter<Context extends Record<string | number | symbol, unknown>>(
  handler: Middleware<Context>,
): RouteHandler<unknown, unknown> {
  return (context) => {
    const rawContext = context as unknown as Record<string, unknown>;
    rawContext.context ??= {};
    return handler(context.request, rawContext.context as Context);
  };
}

const router = createRouter();

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  router.post("/_telefunc", handlerAdapter(telefuncHandler));
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters/fetch}
   **/
  router.use("/api/trpc/*", (context) => {
    return fetchRequestHandler({
      router: appRouter,
      req: context.request,
      endpoint: "/api/trpc",
      createContext({ req }) {
        return { req };
      },
    });
  });
}

if (BATI.has("ts-rest")) {
  /**
   * ts-rest route
   *
   * @link {@see https://ts-rest.com/docs/serverless/fetch-runtimes/}
   **/
  const tsrRouter = tsr.platformContext<{ context: AdapterRequestContext }>().router(contract, {
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
        await db.insert(todoTable).values({ text: body.text });
      } else {
        lowDb.update(({ todo }) => todo.push({ text: body.text }));
      }
      return {
        status: 200,
        body: {
          status: "Ok",
        },
      };
    },
  });

  router.use("/api/*", (context) => {
    return tsrFetchRequestHandler({
      request: context.request,
      contract,
      router: tsrRouter,
      platformContext: {
        context,
      },
      options: {
        basePath: "/api",
      },
    });
  });
}

if (BATI.has("authjs") || BATI.has("auth0")) {
  /**
   * Append Auth.js session to context
   **/
  router.use(handlerAdapter(authjsSessionMiddleware));

  /**
   * Auth.js route
   * @link {@see https://authjs.dev/getting-started/installation}
   **/
  router.use("/api/auth/*", handlerAdapter(authjsHandler));
}

if (BATI.has("firebase-auth")) {
  router.use(handlerAdapter(firebaseAuthMiddleware));
  router.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
  router.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
}

if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
  router.post("/api/todo/create", handlerAdapter(createTodoHandler));
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
router.use(handlerAdapter(vikeHandler));

export default router.buildHandler() as HattipHandler;
