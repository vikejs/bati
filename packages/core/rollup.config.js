import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "node:fs";

import terser from "@rollup/plugin-terser";

// rollup.config.js
export default [
  {
    input: "./src/index.ts",
    output: [{ dir: "dist", format: "es" }],
    external: ["acorn-stage3", "hermes-parser", "tenko"],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      {
        // putout loader uses a dynamic require.resolve, which we replace
        name: "bati:fix-putout-resolve",
        load(id) {
          if (id.endsWith("engine-loader/lib/load.js")) {
            const content = readFileSync(id, "utf-8");
            return content
              .replace("createRequire(require.resolve(PUTOUT_YARN_PNP))", "require('putout')")
              .replace("createRequire(require.resolve('putout'))", "require('putout')");
          }
          return null;
        },
      },
      commonjs({
        esmExternals: true,
        requireReturnsDefault: "namespace",
        ignore: ["acorn-stage3", "hermes-parser", "tenko"],
      }),
      json(),
      typescript({
        sourceMap: false,
        include: ["src/**"],
      }),
      terser(),
    ],
  },
  {
    input: "./src/index.ts",
    output: [{ file: "./dist/index.d.ts" }],
    plugins: [dts()],
    external: ["acorn-stage3", "hermes-parser", "tenko"],
  },
];
