// BATI.has("auth0") || BATI.hasDatabase
import "dotenv/config";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import {
  luciaAuthContextMiddleware,
  luciaAuthCookieMiddleware,
  luciaAuthLoginHandler,
  luciaAuthLogoutHandler,
  luciaAuthSignupHandler,
  luciaCsrfMiddleware,
  luciaDbMiddleware,
  luciaGithubCallbackHandler,
  luciaGithubLoginHandler,
} from "@batijs/lucia-auth/server/lucia-auth-handlers";
import { betterAuthHandler } from "@batijs/better-auth/server/better-auth-handler";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import type { HattipHandler } from "@hattip/core";
import { createRouter } from "@hattip/router";
import vercelAdapter from "@hattip/adapter-vercel-edge";
import { createHandler, createMiddleware } from "@universal-middleware/hattip";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";

const router = createRouter();

if (BATI.hasDatabase) {
  /**
   * Make database available in Context as `context.db`
   */
  router.use(createMiddleware(dbMiddleware)());
}

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  router.post("/_telefunc", createHandler(telefuncHandler)());
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters/fetch}
   **/
  router.use("/api/trpc/*", createHandler(trpcHandler)("/api/trpc"));
}

if (BATI.has("ts-rest")) {
  router.use("/api/*", createMiddleware(tsRestHandler)());
}

if (BATI.has("authjs") || BATI.has("auth0")) {
  /**
   * Append Auth.js session to context
   **/
  router.use(createMiddleware(authjsSessionMiddleware)());

  /**
   * Auth.js route
   * @link {@see https://authjs.dev/getting-started/installation}
   **/
  router.use("/api/auth/*", createHandler(authjsHandler)());
}

if (BATI.has("firebase-auth")) {
  router.use(createMiddleware(firebaseAuthMiddleware)());
  router.post("/api/sessionLogin", createHandler(firebaseAuthLoginHandler)());
  router.post("/api/sessionLogout", createHandler(firebaseAuthLogoutHandler)());
}

if (BATI.has("lucia-auth")) {
  router.use(createMiddleware(luciaDbMiddleware)());
  router.use(createMiddleware(luciaCsrfMiddleware)());
  router.use(createMiddleware(luciaAuthContextMiddleware)());
  router.use(createMiddleware(luciaAuthCookieMiddleware)());

  router.post("/api/signup", createHandler(luciaAuthSignupHandler)());
  router.post("/api/login", createHandler(luciaAuthLoginHandler)());
  router.post("/api/logout", createHandler(luciaAuthLogoutHandler)());
  router.get("/api/login/github", createHandler(luciaGithubLoginHandler)());
  router.get("/api/login/github/callback", createHandler(luciaGithubCallbackHandler)());
}

if (BATI.has("better-auth")) {
  /**
   * Better-Auth route
   **/
  router.use("/api/auth/**", createHandler(betterAuthHandler)());
}

if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
  router.post("/api/todo/create", createHandler(createTodoHandler)());
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
router.use(createHandler(vikeHandler)());

const handler: HattipHandler = router.buildHandler();

//# BATI.has("vercel")
export const GET = vercelAdapter(handler);
//# BATI.has("vercel")
export const POST = vercelAdapter(handler);

export default BATI.has("vercel") ? (process.env.NODE_ENV === "production" ? undefined : handler) : handler;
