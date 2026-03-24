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
  banner: {
    js: "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
  },
});
