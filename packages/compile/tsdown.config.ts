import { defineConfig } from "tsdown";
import { purgePolyfills } from "unplugin-purge-polyfills";

export default defineConfig({
  entry: ["index.ts"],
  clean: true,
  format: "esm",
  fixedExtension: false,
  dts: true,
  outDir: "./dist",
  plugins: [purgePolyfills.rolldown({})],
  shims: true,
});
