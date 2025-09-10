// BATI.has("auth0") || BATI.hasDatabase
import "dotenv/config";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import { apply, serve } from "@photonjs/fastify";
import fastify, { type FastifyInstance } from "fastify";
import rawBody from "fastify-raw-body";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default await startServer();

async function startServer(): Promise<FastifyInstance> {
  const app = fastify({
    // Ensures proper HMR support
    forceCloseConnections: true,
  });

  // /!\ Mandatory if you need to access the request body in any Universal Middleware or Handler
  await app.register(rawBody);

  await apply(app, [
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
    tsRestHandler,
    //# !BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")
    createTodoHandler,
  ]);

  return serve(app, {
    port,
  });
}
