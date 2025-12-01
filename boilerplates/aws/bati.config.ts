import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("aws");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Ensure that AWS credentials are configured. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
  enforce: "post",
});
