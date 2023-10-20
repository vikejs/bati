import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";
import { defineConfig } from "tsup";

// Note: there is no equivalent to require.resolve in esm, so we simplify this so that esbuild can
// do its magic.
const putoutFixPlugin: Plugin = {
  name: "putout-fix-plugin",
  setup(build) {
    build.onLoad({ filter: /engine-loader\/lib\/load\/load\.js$/ }, async (args) => {
      const source = await readFile(args.path, "utf8");
      const contents = source
        .replace("createRequire(require.resolve(PUTOUT_YARN_PNP))", "require('putout')")
        .replace("createRequire(require.resolve('putout'))", "require('putout')");
      return { contents, loader: "default" };
    });
  },
};

const eslintFixPlugin: Plugin = {
  name: "eslint-fix-plugin",
  setup(build) {
    // eslint ESM is not properly built
    build.onLoad({ filter: /eslint\/lib\/linter\/node-event-generator\.js$/ }, async (args) => {
      const source = await readFile(args.path, "utf8");

      const contents = source
        .replace("esquery.matches", "esquery.default.matches")
        .replace("esquery.parse", "esquery.default.parse");
      return { contents, loader: "default" };
    });

    // eslint doesn't allow to override `basePath` with flat config
    build.onLoad({ filter: /eslint\/lib\/linter\/linter\.js$/ }, async (args) => {
      let contents = await readFile(args.path, "utf8");

      if (!contents.includes(`configArray = new FlatConfigArray(config);`)) {
        throw new Error(
          "[eslintFixPlugin] FlatConfigArray usage updated, eslint-fix-plugin probably needs to be updated",
        );
      }

      contents = contents.replace(
        `configArray = new FlatConfigArray(config);`,
        `configArray = new FlatConfigArray(config, { shouldIgnore: false, basePath: path.dirname(options.filename) });`,
      );

      return { contents, loader: "default" };
    });
  },
};

// esquery.matches
// esquery.parse

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  target: "es2020",
  outDir: "./dist",
  dts: true,
  bundle: true,
  esbuildPlugins: [eslintFixPlugin],
  minify: true,

  // Note: this is for putout because esbuild can't properly treeshake the code, and is not aware
  // that we do not use those dependencies.
  // external: ["acorn-stage3", "hermes-parser", "tenko"],
  noExternal: ["espree"],

  esbuildOptions(options) {
    // Defaults to ["main", "module"] for platform node, but we prefer module if it's available
    // https://esbuild.github.io/api/#platform
    options.mainFields = ["module", "main"];
  },
  // esbuildPlugins: [putoutFixPlugin],
  banner: {
    js: `import { createRequire } from 'module';
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
    // js: `import { createRequire } from 'module';
    // const require = createRequire(import.meta.url);
    // `,
  },
});
