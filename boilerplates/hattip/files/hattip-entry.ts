import { authjsHandler } from "@batijs/authjs/server/authjs-handler";
import { vikeAdapter } from "@batijs/shared-server/server/vike-adapter";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import type { HattipHandler } from "@hattip/core";
import { createRouter, type RouteHandler } from "@hattip/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

function handlerAdapter<Context extends Record<string | number | symbol, unknown>>(
  handler: (request: Request, context: Context) => Promise<Response>,
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

if (BATI.has("authjs")) {
  router.use("/api/auth/*", handlerAdapter(authjsHandler));
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
router.use(handlerAdapter(vikeAdapter));

export default router.buildHandler() as HattipHandler;
