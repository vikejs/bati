/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["*.local.spec.ts"],
    testTimeout: 100000,
  },
});
