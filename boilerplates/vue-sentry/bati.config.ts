import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("vue") && meta.BATI.has("sentry");
  },
});
