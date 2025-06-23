import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";
import { defineConfig } from "tsup";
import { purgePolyfills } from "unplugin-purge-polyfills";

const eslintFixPlugin: Plugin = {
  name: "eslint-fix-plugin",
  setup(build) {
    // eslint ESM is not properly built
    build.onLoad({ filter: /eslint[/\\]lib[/\\]linter[/\\]esquery\.js$/ }, async (args) => {
      const source = await readFile(args.path, "utf8");

      const contents = source
        .replace("esquery.matches", "esquery.default.matches")
        .replace("esquery.parse", "esquery.default.parse");
      return { contents, loader: "default" };
    });
  },
};

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  target: "es2022",
  outDir: "./dist",
  dts: true,
  bundle: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esbuildPlugins: [eslintFixPlugin, purgePolyfills.esbuild({}) as any],
  minify: true,
  // metafile: true,

  noExternal: ["espree"],

  esbuildOptions(options) {
    // Defaults to ["main", "module"] for platform node, but we prefer module if it's available
    // https://esbuild.github.io/api/#platform
    options.mainFields = ["module", "main"];
  },
  banner: {
    js: `import { createRequire as BATI_core_createRequire } from 'module';
import { fileURLToPath as BATI_fileURLToPath } from "node:url";
import { dirname as BATI_dirname } from "node:path";
const require = BATI_core_createRequire(import.meta.url);

const __filename = BATI_fileURLToPath(import.meta.url);
const __dirname = BATI_dirname(__filename);
`,
  },
});
