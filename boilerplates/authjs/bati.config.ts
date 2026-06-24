import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("authjs") || meta.BATI.has("auth0");
  },
  knip: {
    entry: ["server/authjs-handler.ts"],
  },
});
