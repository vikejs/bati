import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("vercel");
  },
  knip: {
    ignore: [".vercel/**"],
    ignoreDependencies: ["vite-plugin-vercel"],
  },
});
