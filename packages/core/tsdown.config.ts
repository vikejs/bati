import { createRequire } from "node:module";
import type { Plugin } from "rolldown";
import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";

const require = createRequire(import.meta.url);

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

// The package barrel pulls every rule (~1.2 MB rendered) but only `no-unused-vars` is used.
// Its `exports` map doesn't expose individual rules, so we import the rule file by absolute path.
const tsEslintNoUnusedVars = require
  .resolve("@typescript-eslint/eslint-plugin/package.json")
  .replace(/package\.json$/, "dist/rules/no-unused-vars.js");

const stubTsEslintPlugin = virtualStub("ts-eslint-plugin", {
  "@typescript-eslint/eslint-plugin": `import * as rule from ${JSON.stringify(tsEslintNoUnusedVars)};
export default { rules: { "no-unused-vars": rule.default } };`,
});

// `eslint/lib/config/config-loader.js` pulls jiti to load `eslint.config.ts` files; we instantiate
// `Linter` directly so the path is dead at runtime.
const stubJiti = virtualStub("jiti", {
  jiti: `export const createJiti = () => { throw new Error("@batijs/core does not load eslint config files"); };`,
  "jiti/package.json": `export default { version: "0.0.0" };`,
});

// `\0` marks the id as virtual; the extension keeps rolldown's JSON loader away from specifiers
// like `jiti/package.json`, and the slash/dot escapes prevent further extension sniffing.
function virtualStub(name: string, sources: Record<string, string>): Plugin {
  const idFor = (specifier: string) => `\0stub:${name}:${specifier.replace(/[/.]/g, "_")}.js`;
  const byId = new Map(Object.entries(sources).map(([spec, src]) => [idFor(spec), src]));
  return {
    name: `stub-${name}`,
    resolveId(source) {
      if (source in sources) return { id: idFor(source), moduleSideEffects: false };
    },
    load(id) {
      return byId.get(id);
    },
  };
}

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
    plugins: [eslintFixPlugin, stubTsEslintPlugin, stubJiti, purgePolyfills.rolldown({})],
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
