import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("storybook");
  },
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} storybook`,
      },
    ];
  },
  knip: {
    ignoreDependencies: ["playwright", "@vitest/coverage-v8"],
  },
});
