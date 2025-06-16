// BATI.has("auth0") || BATI.hasDatabase
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
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createHandler, createMiddleware } from "@universal-middleware/hono";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";

const app = new Hono();

if (BATI.hasDatabase) {
  /**
   * Make database available in Context as `context.db`
   */
  app.use(createMiddleware(dbMiddleware)());
}

if (BATI.has("authjs") || BATI.has("auth0")) {
  /**
   * Append Auth.js session to context
   **/
  app.use(createMiddleware(authjsSessionMiddleware)());

  /**
   * Auth.js route
   * @link {@see https://authjs.dev/getting-started/installation}
   **/
  app.use("/api/auth/**", createHandler(authjsHandler)());
}

if (BATI.has("firebase-auth")) {
  app.use(createMiddleware(firebaseAuthMiddleware)());
  app.post("/api/sessionLogin", createHandler(firebaseAuthLoginHandler)());
  app.post("/api/sessionLogout", createHandler(firebaseAuthLogoutHandler)());
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters}
   **/
  app.use("/api/trpc/*", createHandler(trpcHandler)("/api/trpc"));
}

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  app.post("/_telefunc", createHandler(telefuncHandler)());
}

if (BATI.has("ts-rest")) {
  app.all("/api/*", createHandler(tsRestHandler)());
}

if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
  app.post("/api/todo/create", createHandler(createTodoHandler)());
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
app.all("*", createHandler(vikeHandler)());

//# BATI.has("vercel")
export const GET = handle(app);
//# BATI.has("vercel")
export const POST = handle(app);

export default BATI.has("vercel") ? (process.env.NODE_ENV === "production" ? undefined : app) : app;
