import { defineConfig } from "tsup";
import esbuildBundleAllPlugin from "./esbuild-bundle-all.js";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  outDir: "./dist",
  clean: true,
  bundle: true,
  esbuildPlugins: [esbuildBundleAllPlugin],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
