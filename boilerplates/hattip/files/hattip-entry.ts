// BATI.has("auth0")
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
  luciaGithubCallbackHandler,
  luciaGithubLoginHandler,
} from "@batijs/lucia-auth/server/lucia-auth-handlers";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import type { HattipHandler } from "@hattip/core";
import { createRouter } from "@hattip/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import vercelAdapter from "@hattip/adapter-vercel-edge";
import { createHandler, createMiddleware } from "@universal-middleware/hattip";

//# BATI.has("sentry") && BATI.has("aws-lambda-serverless")
import * as SentryAWS from "@sentry/aws-serverless";
import * as SentryNode from "@sentry/node";

if (BATI.has("sentry") && !BATI.has("aws-lambda-serverless")) {
  /**
   * Sentry Configuration
   */
  SentryNode.init({ dsn: process.env.SENTRY_DSN });
}

const router = createRouter();

if (BATI.has("sentry")) {
  /**
   * Sentry Error Caption route
   */
  router.use(async (ctx) => {
    ctx.handleError = async (error: Error) => {
      await (BATI.has("aws-lambda-serverless") ? SentryAWS : SentryNode).captureException(error);
      return new Response(
        process.env.NODE_ENV === "production" || error?.message === undefined ? "Internal Server Error" : error.message,
        {
          status: 500,
        },
      );
    };
  });
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
  router.use(createMiddleware(luciaCsrfMiddleware)());
  router.use(createMiddleware(luciaAuthContextMiddleware)());
  router.use(createMiddleware(luciaAuthCookieMiddleware)());

  router.post("/api/signup", createHandler(luciaAuthSignupHandler)());
  router.post("/api/login", createHandler(luciaAuthLoginHandler)());
  router.post("/api/logout", createHandler(luciaAuthLogoutHandler)());
  router.get("/api/login/github", createHandler(luciaGithubLoginHandler)());
  router.get("/api/login/github/callback", createHandler(luciaGithubCallbackHandler)());
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
