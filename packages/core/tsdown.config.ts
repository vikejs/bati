import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";

// The runtime dependencies (@codegraft/* and the tree-sitter-* grammars) load their WASM by URL at
// run time, so they must stay external — bundling them would break that resolution. Everything else
// (the dev-only deps) is inlined so the published `@batijs/core` is self-contained.
const isRuntimeDep = (id: string) => /^(@codegraft\/|tree-sitter-)/.test(id);

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
      alwaysBundle: (id) => !isRuntimeDep(id),
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
      neverBundle: [/@batijs\/.*/, /@codegraft\/.*/, "@types/unist", "@types/mdast"],
      onlyBundle: false,
    },
    inputOptions: {
      resolve: {
        mainFields: ["module", "main"],
      },
    },
  },
]);
