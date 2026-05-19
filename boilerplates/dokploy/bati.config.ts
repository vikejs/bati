import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("dokploy");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `${bold("dokploy")}: Check ${bold("TODO.md")} for remaining steps.`,
      },
    ];
  },
  enforce: "post",
});
