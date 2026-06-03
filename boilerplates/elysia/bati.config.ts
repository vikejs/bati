import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("elysia");
  },
  knip: {
    entry: ["+server.ts"],
  },
});
