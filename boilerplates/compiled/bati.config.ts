import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("compiled-css");
  },
  knip: {
    ignore: ["vite.config.ts"],
    ignoreDependencies: ["@compiled/react", "@vitejs/plugin-react", "vite-plugin-compiled-react"],
    vite: false,
  },
});
