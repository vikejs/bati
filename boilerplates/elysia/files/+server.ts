// (BATI.has("auth0") || BATI.hasDatabase) && !BATI.has("cloudflare")
import "dotenv/config";
import type { Server } from "vike/types";
import { app } from "./server/elysia";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// https://vike.dev/server
export default {
  fetch: app.fetch,
  prod: {
    port,
  },
} satisfies Server;
