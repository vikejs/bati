import { defineConfig } from "@batijs/tsup";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  outDir: "./dist",
});
