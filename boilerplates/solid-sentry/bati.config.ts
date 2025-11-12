import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("solid") && meta.BATI.has("sentry");
  },
});
