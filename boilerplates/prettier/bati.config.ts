import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prettier");
  },
  knip: {
    ignoreDependencies: ["prettier", "eslint-config-prettier"],
  },
});
