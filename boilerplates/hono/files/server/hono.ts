import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import { betterAuthHandler, betterAuthSessionMiddleware } from "@batijs/better-auth/server/better-auth-handler";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import vike from "@vikejs/hono";
import { Hono } from "hono";

function getApp() {
  const app = new Hono();

  vike(app, [
    // $$.BATI.hasDbDemo
    // Make database available in Context as `context.db`
    dbMiddleware,
    // $$.BATI.has("authjs") || $$.BATI.has("auth0")
    // Append Auth.js session to context
    authjsSessionMiddleware,
    // $$.BATI.has("authjs") || $$.BATI.has("auth0")
    // Auth.js route. See https://authjs.dev/getting-started/installation
    authjsHandler,
    // $$.BATI.has("better-auth")
    // Append Better Auth user to context
    betterAuthSessionMiddleware,
    // $$.BATI.has("better-auth")
    // Better Auth route. See https://better-auth.com/docs/installation
    betterAuthHandler,
    // $$.BATI.has("trpc")
    // tRPC route. See https://trpc.io/docs/server/adapters
    trpcHandler("/api/trpc"),
    // $$.BATI.has("telefunc")
    // Telefunc route. See https://telefunc.com
    telefuncHandler,
    // $$.BATI.has("ts-rest")
    // ts-rest route. See https://ts-rest.com
    tsRestHandler,
    // !$$.BATI.has("telefunc") && !$$.BATI.has("trpc") && !$$.BATI.has("ts-rest")
    createTodoHandler,
  ]);

  return app;
}

export const app = getApp();
