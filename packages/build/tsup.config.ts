import { defineConfig } from "@batijs/tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  bundle: true,
  clean: true,
  dts: true,
  outDir: "./dist",
});
