import { authjsHandler } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import type { HattipHandler } from "@hattip/core";
import { createRouter, type RouteHandler } from "@hattip/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

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

if (BATI.has("authjs") || BATI.has("auth0")) {
  router.use("/api/auth/*", handlerAdapter(authjsHandler));
}

if (BATI.has("firebase-auth")) {
  router.use(handlerAdapter(firebaseAuthMiddleware));
  router.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
  router.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
router.use(handlerAdapter(vikeHandler));

export default router.buildHandler() as HattipHandler;
