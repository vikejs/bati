import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/cli.ts"],
  platform: "node",
  format: "esm",
  fixedExtension: false,
  target: "es2022",
  outDir: "./dist",
  dts: true,
  minify: false,
  inputOptions: {
    resolve: {
      mainFields: ["module", "main"],
    },
  },
});
