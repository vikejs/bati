import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("express");
  },
  knip: {
    entry: ["server/entry.ts"],
  },
});
