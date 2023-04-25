import { defineConfig } from "@batijs/tsup";
import { copy } from "esbuild-plugin-copy";

export default defineConfig([
  {
    entry: ["./index.ts"],
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
]);
