import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    console.log("hasUD", meta.BATI.hasUD);
    return meta.BATI.hasUD;
  },
});
