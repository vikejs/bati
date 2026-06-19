import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("kysely");
  },
  // migrate.mjs reads these off disk at runtime (FileMigrationProvider), so the sources must ship.
  deploy: ["database/kysely/migrations"],
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
  // ORM skill (SKILLS_PLAN.md §6.I) — dynamic on the selected engine (§9).
  skills(meta) {
    const run = meta.BATI.pmRun;
    const engine = meta.BATI.has("postgres") ? "PostgreSQL" : meta.BATI.hasD1 ? "Cloudflare D1 (SQLite)" : "SQLite";
    const apply = meta.BATI.hasD1
      ? "wrangler d1 migrations apply MY_VIKE_DEMO_DATABASE --local"
      : `${run} kysely:migrate`;
    return [
      {
        name: "kysely",
        description:
          "How to work with the database via the Kysely query builder in this app. Use when adding a table, writing a query, or running a migration.",
        body: `Kysely query builder on ${engine}. Typed DB interface in \`database/kysely/types.ts\`, queries in \`database/kysely/queries/\`, connection in \`database/kysely/db.ts\`. Migrations are hand-written in \`database/kysely/migrations/\`.

- **Add a table:** add a migration file in \`database/kysely/migrations/\` (e.g. \`002_*.ts\`) exporting \`up\`/\`down\`, and add the table to the \`Database\` interface in \`database/kysely/types.ts\`.
- **Run migrations:** \`${apply}\`.
- **Write queries:** add functions in \`database/kysely/queries/\` using the typed \`db\`; on the server it's available as \`context.db\`.

See https://kysely.dev.`,
      },
    ];
  },
});
