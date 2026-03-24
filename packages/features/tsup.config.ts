import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "./src/index.ts", rules: "./src/rules/index.ts" },
  platform: "neutral",
  format: "esm",
  target: "es2022",
  bundle: true,
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  outDir: "./dist",
  esbuildOptions(options) {
    options.mainFields = ["module", "main"];
  },
});
