import { defineConfig } from "@batijs/core";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("solid") && meta.BATI.has("sentry");
  },
});
