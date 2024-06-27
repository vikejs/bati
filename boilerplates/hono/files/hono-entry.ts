// BATI.has("auth0")
import "dotenv/config";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

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
  app.all("/api/*", handlerAdapter(tsRestHandler));
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

export default app;
