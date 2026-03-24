import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/prepare.ts"],
  platform: "node",
  format: "esm",
  fixedExtension: false,
  target: "es2022",
  outDir: "./dist",
  dts: false,
  minify: false,
  inputOptions: {
    resolve: {
      mainFields: ["module", "main"],
    },
  },
});
