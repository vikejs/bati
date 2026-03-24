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
    shims: true,
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
