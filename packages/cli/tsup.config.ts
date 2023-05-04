import { defineConfig } from "@batijs/tsup";
import esbuildBundleAllPlugin from "./esbuild-bundle-all";
import esbuildFixEsqueryExportsPlugin from "./esbuild-fix-esquery-exports";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  outDir: "./dist",
  esbuildPlugins: [esbuildBundleAllPlugin, esbuildFixEsqueryExportsPlugin],
  noExternal: ["espree"],
  shims: true,
  platform: "node",
  banner: {
    js: `import { fileURLToPath as topFileURLToPath } from 'url';
import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
`,
  },
});
