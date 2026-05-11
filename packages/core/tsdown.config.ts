import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";

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
    plugins: [purgePolyfills.rolldown({})],
    minify: true,
    deps: {
      alwaysBundle: [/./],
      neverBundle: [/@ast-grep\//],
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
    inputOptions: {
      resolve: {
        mainFields: ["module", "main"],
      },
    },
  },
]);
