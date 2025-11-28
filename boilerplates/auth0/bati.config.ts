import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("auth0");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Add the Auth0 configuration to the .env file. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
});
