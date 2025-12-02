import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("fastify");
  },
  knip: {
    entry: ["server/entry.ts"],
  },
});
