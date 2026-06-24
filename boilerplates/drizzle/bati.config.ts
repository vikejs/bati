import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("drizzle");
  },
  // Migrations and drizzle-kit config run as raw source at container startup; drizzle.config.ts imports server/load.ts.
  deploy: ["database/migrations", "drizzle.config.ts", "server/load.ts"],
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
