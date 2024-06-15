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
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { tsr, fetchRequestHandler as tsrFetchRequestHandler } from "@ts-rest/serverless/fetch";
import { Hono, type Context } from "hono";
import { compress } from "hono/compress";
import { createMiddleware } from "hono/factory";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface Middleware<Context extends Record<string | number | symbol, unknown>> {
  (request: Request, context: Context): Response | void | Promise<Response> | Promise<void>;
}

export function handlerAdapter<Context extends Record<string | number | symbol, unknown>>(
  handler: Middleware<Context>,
) {
  return createMiddleware(async (context, next) => {
    let ctx = context.get("context");
    if (!ctx) {
      ctx = {};
      context.set("context", ctx);
    }

    const res = await handler(context.req.raw, ctx as Context);
    context.set("context", ctx);

    if (!res) {
      await next();
    }

    return res;
  });
}

const app = new Hono();

app.use(compress());

if (isProduction) {
  app.use(
    "/*",
    serveStatic({
      root: `dist/client/`,
    }),
  );
}

if (BATI.has("authjs") || BATI.has("auth0")) {
  /**
   * Append Auth.js session to context
   **/
  app.use(handlerAdapter(authjsSessionMiddleware));

  /**
   * Auth.js route
   * @link {@see https://authjs.dev/getting-started/installation}
   **/
  app.use("/api/auth/**", handlerAdapter(authjsHandler));
}

if (BATI.has("firebase-auth")) {
  app.use(handlerAdapter(firebaseAuthMiddleware));
  app.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
  app.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters}
   **/
  app.use("/api/trpc/*", (c) => {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext({ req, resHeaders }): FetchCreateContextFnOptions {
        return { req, resHeaders };
      },
    });
  });
}

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  app.post("/_telefunc", handlerAdapter(telefuncHandler));
}

if (BATI.has("ts-rest")) {
  /**
   * ts-rest route
   *
   * @link {@see https://ts-rest.com/docs/serverless/fetch-runtimes/}
   **/
  const router = tsr.platformContext<{ context: Context }>().router(contract, {
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

  app.all("/api/*", async (c) => {
    return tsrFetchRequestHandler({
      request: new Request(c.req.url, c.req.raw),
      contract,
      router,
      options: {},
      platformContext: {
        context: c,
      },
    });
  });
}

if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
  app.post("/api/todo/create", handlerAdapter(createTodoHandler));
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
app.all("*", handlerAdapter(vikeHandler));

if (isProduction) {
  console.log(`Server listening on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port: port,
  });
}

export default app;
