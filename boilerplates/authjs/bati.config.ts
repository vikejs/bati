import { defineConfig } from "@batijs/core";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("authjs") || meta.BATI.has("auth0");
  },
});
