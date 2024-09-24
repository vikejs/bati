import { defineConfig } from "tsup";
import esbuildBundleAllPlugin from "./esbuild-bundle-all.js";
import { purgePolyfills } from "unplugin-purge-polyfills";

export default defineConfig({
  entry: {
    index: "index.ts",
  },
  format: ["esm"],
  outDir: "./dist",
  clean: true,
  bundle: true,
  esbuildPlugins: [esbuildBundleAllPlugin, purgePolyfills.esbuild({})],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
  noExternal: ["@batijs/core", "@batijs/features"],
});
