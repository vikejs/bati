/*# BATI include-if-imported #*/

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { enhance, type Get, type UniversalHandler } from "@universal-middleware/core";
import { appRouter } from "../trpc/server";

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
export const trpcHandler = ((endpoint) =>
  enhance(
    (request, context, runtime) => {
      return fetchRequestHandler({
        endpoint,
        req: request,
        router: appRouter,
        createContext({ req, resHeaders }) {
          return {
            ...(context as BATI.Any),
            ...(runtime as BATI.If<{
              "BATI.hasD1": { runtime: "workerd"; env?: { DB: D1Database } };
            }>),
            req,
            resHeaders,
          };
        },
      });
    },
    {
      name: "my-app:trpc-handler",
      path: `${endpoint}/**`,
      method: ["GET", "POST"],
      immutable: false,
    },
  )) satisfies Get<[endpoint: string], UniversalHandler>;
