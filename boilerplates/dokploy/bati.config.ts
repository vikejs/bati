import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("dokploy");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Push your repository to a Git provider, then create a new project in Dokploy. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
  enforce: "post",
});
