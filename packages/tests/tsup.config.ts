import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  target: "es2022",
  outDir: "./dist",
  dts: false,
  bundle: true,
  minify: false,
  clean: true,
  esbuildOptions(options) {
    options.mainFields = ["module", "main"];
  },
});
