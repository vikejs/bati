import { defineConfig } from "tsup";
import { copy } from "esbuild-plugin-copy";

export default defineConfig([
  {
    entry: ["./files/**/\\$*.ts"],
    format: "esm",
    clean: true,
    dts: false,
    outDir: "./dist/files",
    external: ["magicast"],
    esbuildPlugins: [
      copy({
        assets: {
          from: ["./files/**/!($*)"],
          to: ["."],
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
