import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("react");
  },
  knip: {
    ignoreDependencies: ["react-dom", "@types/react-dom"],
  },
});
