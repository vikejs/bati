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
  // Raw DB-engine skill — only emitted when no ORM is selected (see `if`).
  skills(meta) {
    const run = meta.BATI.pmRun;
    return [
      {
        name: "database",
        description:
          "How to work with the database in this app (raw PostgreSQL / postgres.js). Use when querying, adding a table, or migrating.",
        body: `Raw PostgreSQL via postgres.js (no ORM). The client is in \`database/postgres/db.ts\`, schema in \`database/postgres/schema/\`, queries in \`database/postgres/queries/\`. Connection comes from \`DATABASE_URL\` in \`.env\`.

- **Add a table:** add it to \`database/postgres/schema/\` and migrate with \`${run} postgres:migrate\`.
- **Write queries:** add functions in \`database/postgres/queries/\` using the \`sql\` client; on the server it's available as \`context.db\`.

See https://github.com/porsager/postgres.`,
      },
    ];
  },
});
