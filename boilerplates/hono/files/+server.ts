// ($$.BATI.has("auth0") || $$.BATI.hasDatabase) && !$$.BATI.has("cloudflare")
import "@batijs/shared-env/server/load";
import type { Server } from "vike/types";
import { app } from "./server/hono";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// https://vike.dev/server
export default {
  fetch: app.fetch,
  prod: {
    port,
    //# $$.BATI.has("aws")
    // We need to override static root config when deploying to AWS
    static: `${process.cwd()}/dist/client`,
  },
} satisfies Server;
