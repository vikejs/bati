/*# BATI include-if-imported #*/

import type { D1Database } from "@cloudflare/workers-types";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
// TODO: stop using universal-middleware and directly integrate server middlewares instead and/or use vike-server https://vike.dev/server. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import type { Get, UniversalHandler } from "@universal-middleware/core";
import { appRouter } from "../trpc/server";

export const trpcHandler = ((endpoint) => (request, context, runtime) => {
  return fetchRequestHandler({
    endpoint,
    req: request,
    router: appRouter,
    createContext({ req, resHeaders }) {
      return {
        ...(context as BATI.Any),
        ...(runtime as BATI.If<{
          "BATI.hasD1": { runtime: "workerd"; adapter: "cloudflare-pages"; env?: { DB: D1Database } };
        }>),
        req,
        resHeaders,
      };
    },
  });
}) satisfies Get<[endpoint: string], UniversalHandler>;
