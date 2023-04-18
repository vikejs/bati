import { defineConfig } from "tsup";
import { copy } from "esbuild-plugin-copy";

export default defineConfig([
  {
    entry: ["./index.ts"],
    format: "esm",
    clean: true,
    dts: true,
    outDir: "./dist",
    external: [],
    esbuildPlugins: [
      copy({
        assets: {
          from: ["./files/**/!($*)"],
          to: ["./files"],
        },
      }),
    ],
  },
  {
    entry: ["./index.ts"],
    format: "esm",
    clean: true,
    dts: true,
    outDir: "./dist",
  },
]);
