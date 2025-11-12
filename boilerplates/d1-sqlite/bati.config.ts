import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.hasD1 && meta.BATI.has("sqlite");
  },
});
