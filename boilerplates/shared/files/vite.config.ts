//# BATI.has("REMOVE-COMMENT") || "remove-comments-only"
/// <reference types="vite-plugin-vercel/types" />
/// <reference types="@batijs/core/types" />

import vike from "vike/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vike()],
  build: {
    //# BATI.hasD1
    rollupOptions: {
      external: ["wrangler"],
    },
    target: "es2022",
  },
  //# BATI.has("vercel") && BATI.hasServer
  vercel: {
    additionalEndpoints: [
      {
        // entry file to the server. Default export must be a node server or a function
        source: BATI.has("fastify")
          ? "fastify-entry.ts"
          : BATI.has("hono")
            ? "hono-entry.ts"
            : BATI.has("h3")
              ? "h3-entry.ts"
              : "express-entry.ts",
        // replaces default Vike target
        destination: "ssr_",
        // already added by default Vike route
        route: false,
      },
    ],
  },
});
