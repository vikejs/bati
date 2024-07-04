//# BATI.has("REMOVE-COMMENT") || "remove-comments-only"
/// <reference types="vite-plugin-vercel/types" />
import type { UserConfig } from "vite";
import vike from "vike/plugin";

export default {
  plugins: [
    vike({
      //# BATI.has("vercel")
      prerender: true,
    }),
  ],
  //# BATI.has("vercel") && BATI.has("express")
  vercel: {
    additionalEndpoints: [
      {
        // entry file to the server. Default export must be a node server or a function
        source: "express-entry.ts",
        // replaces default Vike target
        destination: "ssr_",
        // already added by default Vike route
        addRoute: false,
      },
    ],
  },
} satisfies UserConfig;
