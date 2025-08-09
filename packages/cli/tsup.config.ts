import { defineConfig } from "tsup";
import { purgePolyfills } from "unplugin-purge-polyfills";
import esbuildBundleAllPlugin from "./esbuild-bundle-all.js";

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
    js: `#!/usr/bin/env node
import { createRequire as createRequire_BATI_CLI } from 'module';
const require = createRequire_BATI_CLI(import.meta.url);
`,
  },
  noExternal: ["@batijs/core", "@batijs/features"],
});
