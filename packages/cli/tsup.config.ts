import { defineConfig } from "@batijs/tsup";
import esbuildPlugin from "./esbuild-bundle-all";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  outDir: "./dist",
  esbuildPlugins: [
    esbuildPlugin,
  ],
});
