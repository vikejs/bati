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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esbuildPlugins: [esbuildBundleAllPlugin, purgePolyfills.esbuild({}) as any],
  platform: "node",
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as createRequire_BATI_CLI } from 'module';
const require = createRequire_BATI_CLI(import.meta.url);
`,
  },
  noExternal: ["@batijs/core", "@batijs/features"],
});
