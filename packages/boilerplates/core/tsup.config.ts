import { defineConfig } from "@batijs/tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    clean: true,
    dts: true,
    bundle: true,
    outDir: "./dist",
    external: [],
  },
]);
