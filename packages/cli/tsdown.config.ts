import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";
import rolldownPlugin, { runPostBuild } from "./rolldown-bundle-all.ts";

export default defineConfig({
  entry: {
    index: "index.ts",
  },
  format: "esm",
  fixedExtension: false,
  outDir: "./dist",
  platform: "node",
  outputOptions: {
    sanitizeFileName: false,
  },
  plugins: [purgePolyfills.rolldown({}), rolldownPlugin],
  banner: {
    js: `#!/usr/bin/env node
`,
  },
  hooks: {
    "build:done": async () => {
      await runPostBuild();
    },
  },
});
