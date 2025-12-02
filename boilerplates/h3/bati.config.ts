import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("h3");
  },
  knip: {
    entry: ["server/entry.ts"],
  },
});
