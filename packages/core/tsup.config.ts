import { defineConfig } from "@batijs/tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    clean: true,
    dts: true,
    bundle: true,
    outDir: "./dist",
    external: [],
    shims: true,
    platform: "node",
    banner: {
      js: `import { fileURLToPath as topFileURLToPath } from 'url';
import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
const __requireResolve = require.resolve;
require.resolve = (x) => x === 'espree' ? undefined : __requireResolve(x);
`,
    },
  },
]);
