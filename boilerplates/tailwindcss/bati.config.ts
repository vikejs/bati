import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("tailwindcss");
  },
  knip: {
    // daisyui is included here because daisyui dependsOn tailwindcss,
    // so this config is always active when daisyui is used
    ignoreDependencies: ["tailwindcss", "daisyui"],
  },
});
