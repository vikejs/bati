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
  // Tooling skill (SKILLS_PLAN.md §6.O).
  skills(meta) {
    const run = meta.BATI.pmRun;
    const ext = meta.BATI.has("vue") ? "ts" : "tsx";
    return [
      {
        name: "storybook",
        description: "How to use Storybook in this app. Use when adding a story or running Storybook.",
        body: `Storybook is configured for component development.

- **Run it:** \`${run} storybook\`.
- **Add a story:** create a \`*.stories.${ext}\` file next to a component, exporting a default \`meta\` and named story exports.

See https://storybook.js.org/docs.`,
      },
    ];
  },
});
