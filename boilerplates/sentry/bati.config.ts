import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("sentry");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Add your Sentry DSN to the .env file. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
});
