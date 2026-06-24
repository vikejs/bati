import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  // Finalizing step: its `after` hook writes the composed skills (see hooks/after.ts). Always included.
  enforce: "post",
});
