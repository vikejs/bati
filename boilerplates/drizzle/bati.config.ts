import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("drizzle");
  },
  env: [
    {
      key: "DATABASE_URL",
      scope: "server-default",
      comment: "Path to the sqlite database",
      default: "sqlite.db",
      perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
      group: "non-D1 database",
      when: ({ meta }) => !meta.BATI.hasD1,
    },
  ],
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
