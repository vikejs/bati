import { defineConfig } from "@batijs/tsup";
import esbuildBundleAllPlugin from "./esbuild-bundle-all.js";

export default defineConfig({
  entry: ["index.ts"],
  outDir: "./dist",
  esbuildPlugins: [esbuildBundleAllPlugin],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
