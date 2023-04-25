import { resolve } from "path";
import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import { generateDtsBundle } from "rollup-plugin-dts-bundle-generator";

// Building with vite instead of tsup to support typia transform mode

export default defineConfig({
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (typescript as any)({ tsconfig: "./tsconfig.json" }),
    generateDtsBundle({
      entry: [
        {
          filePath: resolve(__dirname, "src/index.ts"),
        },
      ],
      outFile: resolve(__dirname, "dist/index.d.ts"),
    }),
  ],
  build: {
    ssr: true,
    target: "node16",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@batijs/core",
      fileName: "index",
      formats: ["es"],
    },
    outDir: resolve(__dirname, "dist"),
  },
});
