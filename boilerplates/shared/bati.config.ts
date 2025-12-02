import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  enforce: "pre",
  knip: {
    ignore: ["*.spec.ts"],
    ignoreDependencies: ["@batijs/tests-utils", "turbo", "photon"],
  },
});
