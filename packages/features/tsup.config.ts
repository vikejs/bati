import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "./src/index.ts", rules: "./src/rules/index.ts" },
  platform: "neutral",
  format: "esm",
  target: "es2020",
  bundle: true,
  clean: true,
  dts: true,
  outDir: "./dist",
  esbuildOptions(options) {
    options.mainFields = ["module", "main"];
  },
});
