import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "./src/index.ts", rules: "./src/rules/index.ts" },
  platform: "neutral",
  format: "esm",
  fixedExtension: false,
  target: "es2022",
  dts: true,
  outDir: "./dist",
  inputOptions: {
    resolve: {
      mainFields: ["module", "main"],
    },
  },
});
