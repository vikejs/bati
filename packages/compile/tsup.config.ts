import { defineConfig } from "tsup";
import { purgePolyfills } from "unplugin-purge-polyfills";

export default defineConfig({
  entry: ["index.ts"],
  clean: true,
  format: "esm",
  dts: true,
  outDir: "./dist",
  esbuildPlugins: [purgePolyfills.esbuild({})],
  banner: {
    js: "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
  },
});
