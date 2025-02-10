import { defineConfig } from "tsup";
import { purgePolyfills } from "unplugin-purge-polyfills";

export default defineConfig({
  entry: ["index.ts"],
  clean: true,
  format: "esm",
  dts: true,
  outDir: "./dist",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esbuildPlugins: [purgePolyfills.esbuild({}) as any],
});
