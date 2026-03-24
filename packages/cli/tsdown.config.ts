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
  clean: true,
  platform: "node",
  plugins: [purgePolyfills.rolldown({}), rolldownPlugin],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as createRequire_BATI_CLI } from 'module';
const require = createRequire_BATI_CLI(import.meta.url);
`,
  },
  hooks: {
    "build:done": async () => {
      await runPostBuild();
    },
  },
});
