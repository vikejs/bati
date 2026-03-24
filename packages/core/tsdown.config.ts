import type { Plugin } from "rolldown";
import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";

const eslintFixPlugin: Plugin = {
  name: "eslint-fix-plugin",
  transform(code, id) {
    if (id.match(/eslint[/\\]lib[/\\]linter[/\\]esquery\.js$/)) {
      return {
        code: code
          .replace("esquery.matches", "esquery.default.matches")
          .replace("esquery.parse", "esquery.default.parse"),
        map: null,
      };
    }
  },
};

export default defineConfig([
  {
    entry: ["./src/config.ts"],
    platform: "node",
    format: "esm",
    fixedExtension: false,
    target: "es2022",
    outDir: "./dist",
    dts: false,
    minify: true,
  },
  {
    entry: ["./src/config.ts"],
    platform: "node",
    format: "esm",
    fixedExtension: false,
    target: "es2022",
    outDir: "./dist",
    dts: {
      emitDtsOnly: true,
    },
    deps: {
      skipNodeModulesBundle: true,
      neverBundle: [/@batijs\/.*/],
    },
    minify: true,
  },
  {
    entry: ["./src/index.ts"],
    platform: "node",
    format: "esm",
    fixedExtension: false,
    target: "es2022",
    outDir: "./dist",
    dts: false,
    plugins: [eslintFixPlugin, purgePolyfills.rolldown({})],
    minify: true,
    deps: {
      alwaysBundle: [/./],
      onlyBundle: false,
    },
    inputOptions: {
      resolve: {
        mainFields: ["module", "main"],
      },
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
  },
  {
    entry: ["./src/index.ts"],
    platform: "node",
    format: "esm",
    fixedExtension: false,
    target: "es2022",
    outDir: "./dist",
    dts: {
      emitDtsOnly: true,
    },
    deps: {
      skipNodeModulesBundle: true,
      neverBundle: [/@batijs\/.*/, "@types/unist", "@types/mdast"],
      onlyBundle: false,
    },
    plugins: [eslintFixPlugin],
    inputOptions: {
      resolve: {
        mainFields: ["module", "main"],
      },
    },
  },
]);
