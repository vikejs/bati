import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: "esm",
  clean: true,
  dts: true,
  outDir: "./dist",
});
