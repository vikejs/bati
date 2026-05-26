import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("kysely");
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
  nextSteps(meta, packageManager, { bold }) {
    if (meta.BATI.hasD1) {
      // D1 migrations are handled differently via wrangler
      return [];
    }
    return [
      {
        type: "text",
        step: `Add your ${bold("DATABASE_URL")} to the .env file. Check ${bold("TODO.md")} for details`,
      },
      {
        type: "command",
        step: `${packageManager} kysely:migrate`,
      },
    ];
  },
  knip: {
    entry: ["database/kysely/migrations/*.ts"],
  },
});
