import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw better-sqlite3 client: the SQLite engine with no ORM/query builder, off Cloudflare (D1).
    return meta.BATI.has("sqlite") && !meta.BATI.hasOrm && !meta.BATI.has("cloudflare");
  },
  // Schema script runs as raw source at container startup and imports server/load.ts.
  deploy: ["database/sqlite", "server/load.ts"],
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} sqlite:migrate`,
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
          "How to work with the database in this app (raw SQLite / better-sqlite3). Use when querying, adding a table, or migrating.",
        body: `Raw SQLite via better-sqlite3 (no ORM). The client is in \`database/sqlite/db.ts\`, schema in \`database/sqlite/schema/\`, queries in \`database/sqlite/queries/\`.

- **Add a table:** add it to \`database/sqlite/schema/\` and migrate with \`${run} sqlite:migrate\`.
- **Write queries:** add functions in \`database/sqlite/queries/\` using the \`db\` client; on the server it's available as \`context.db\`.

See https://github.com/WiseLibs/better-sqlite3.`,
      },
    ];
  },
});
