import { defineConfig } from "@batijs/tsup";
import { copy } from "esbuild-plugin-copy";

export default defineConfig([
  {
    entry: ["./files/**/\\$*.ts"],
    ignoreWatch: ["./dist"],
    dts: false,
    clean: true,
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
    dts: true,
    clean: true,
    outDir: "./dist",
  },
]);
