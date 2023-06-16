/// <reference types="vitest" />
import { configDefaults, defineConfig } from "vitest/config";

const isWin = process.platform === "win32";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  test: {
    // CI is really slow on Windows, so we only run the empty.spec.ts test
    include: isWin && isCI ? ["**/empty.{test,spec}.?(c|m)[jt]s?(x)"] : configDefaults.include,
    minThreads: 1,
    maxThreads: 2,
    testTimeout: 52000,
  },
});
