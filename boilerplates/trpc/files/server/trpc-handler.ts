/*# BATI include-if-imported #*/
import { appRouter } from "../trpc/server";
import type { Get, UniversalHandler } from "@universal-middleware/core";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const trpcHandler = ((endpoint) => (request, context, runtime) => {
  return fetchRequestHandler({
    endpoint,
    req: request,
    router: appRouter,
    createContext({ req, resHeaders }) {
      return {
        ...(context as BATI.Any),
        ...(runtime as BATI.If<{
          "BATI.hasD1": { runtime: "workerd"; adapter: string; env: { DB: D1Database } };
        }>),
        req,
        resHeaders,
      };
    },
  });
}) satisfies Get<[endpoint: string], UniversalHandler>;
