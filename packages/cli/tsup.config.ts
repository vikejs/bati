import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: "esm",
  clean: true,
  dts: false,
  outDir: "./dist",
});
