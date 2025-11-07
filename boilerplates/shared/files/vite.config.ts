//# BATI.has("REMOVE-COMMENT") || "remove-comments-only"
/// <reference types="@photonjs/vercel/types" />
/// <reference types="@batijs/core/types" />

import vike from "vike/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vike()],
  //# BATI.hasD1
  build: {
    rollupOptions: {
      external: ["wrangler"],
    },
  },
});
