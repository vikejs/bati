import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("drizzle");
  },
  nextSteps(_meta, packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Add your drizzle ${bold("DATABASE_URL")} to the .env file. Check ${bold("TODO.md")} for details`,
      },
      {
        type: "command",
        step: `${packageManager} drizzle:generate`,
      },
      {
        type: "command",
        step: `${packageManager} drizzle:migrate`,
      },
    ];
  },
});
