import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  // Finalizing step: its `after` hook writes the composed skills + instruction files (see hooks/after.ts).
  enforce: "post",
  if(meta) {
    return meta.BATI.hasAiAgent;
  },
});
