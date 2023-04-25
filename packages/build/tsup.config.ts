import { defineConfig } from "@batijs/tsup";

export default defineConfig({
  entry: ["./src/**"],
  clean: true,
  dts: true,
  outDir: "./dist",
});
