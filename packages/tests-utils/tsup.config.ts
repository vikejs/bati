import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  target: "es2020",
  outDir: "./dist",
  dts: true,
  bundle: true,
  minify: true,
  clean: true,
  esbuildOptions(options) {
    options.mainFields = ["module", "main"];
  },
});
