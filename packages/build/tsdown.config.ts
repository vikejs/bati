import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  format: "esm",
  fixedExtension: false,
  outDir: "./dist",
});
