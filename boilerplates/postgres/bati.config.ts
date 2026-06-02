import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Standalone postgres.js client — only when no ORM/query-builder owns the engine
    // (Drizzle/Kysely ship their own Postgres connection code).
    return meta.BATI.has("postgres") && !meta.BATI.has("drizzle") && !meta.BATI.has("kysely");
  },
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
