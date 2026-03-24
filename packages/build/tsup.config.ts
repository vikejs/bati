import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  bundle: true,
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  format: ["esm"],
  outDir: "./dist",
});
