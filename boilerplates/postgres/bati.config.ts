import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw postgres.js client: the PostgreSQL engine with no ORM/query builder.
    return meta.BATI.has("postgres") && !meta.BATI.hasOrm;
  },
  // Schema script runs as raw source at container startup and imports server/load.ts.
  deploy: ["database/postgres", "server/load.ts"],
  nextSteps(_meta, packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Set your ${bold("DATABASE_URL")} in .env and provide a PostgreSQL server — see ${bold("TODO.md")}`,
      },
      {
        type: "command",
        step: `${packageManager} postgres:migrate`,
      },
    ];
  },
});
