import { defineConfig } from "@batijs/core";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("react") && meta.BATI.has("sentry");
  },
});
