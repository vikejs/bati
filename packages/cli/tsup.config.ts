import { defineConfig } from "@batijs/tsup";
import esbuildBundleAllPlugin from "./esbuild-bundle-all";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  outDir: "./dist",
  esbuildPlugins: [esbuildBundleAllPlugin],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
