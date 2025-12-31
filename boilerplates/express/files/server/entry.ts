// BATI.has("auth0") || BATI.hasDatabase
import "dotenv/config";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import { getTodosHandler } from "@batijs/vike-react-query/server/todo-handlers";
import { apply, serve } from "@photonjs/express";
import express from "express";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startApp() as unknown;

function startApp() {
  const app = express();

  apply(app, [
    //# BATI.hasDatabase
    // Make database available in Context as `context.db`
    dbMiddleware,
    //# BATI.has("authjs") || BATI.has("auth0")
    // Append Auth.js session to context
    authjsSessionMiddleware,
    //# BATI.has("authjs") || BATI.has("auth0")
    // Auth.js route. See https://authjs.dev/getting-started/installation
    authjsHandler,
    //# BATI.has("trpc")
    // tRPC route. See https://trpc.io/docs/server/adapters
    trpcHandler("/api/trpc"),
    //# BATI.has("telefunc")
    // Telefunc route. See https://telefunc.com
    telefuncHandler,
    //# BATI.has("ts-rest")
    // ts-rest route. See https://ts-rest.com
    tsRestHandler,
    //# BATI.has("vike-react-query")
    getTodosHandler,
    //# !BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")
    createTodoHandler,
  ]);

  return serve(app, {
    port,
  });
}
