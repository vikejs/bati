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
  // ORM skill (SKILLS_PLAN.md §6.I) — dynamic on the selected engine (§9).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    const engine = meta.BATI.has("postgres") ? "PostgreSQL" : meta.BATI.hasD1 ? "Cloudflare D1 (SQLite)" : "SQLite";
    const apply = meta.BATI.hasD1
      ? "wrangler d1 migrations apply MY_VIKE_DEMO_DATABASE --local"
      : `${run} drizzle:migrate`;
    return [
      {
        name: "drizzle",
        description:
          "How to work with the database via Drizzle ORM in this app. Use when adding or changing a table, writing a query, or running a migration.",
        body: `Drizzle ORM on ${engine}. Schema in \`database/drizzle/schema/\`, queries in \`database/drizzle/queries/\`, connection in \`database/drizzle/db.ts\`, drizzle-kit config in \`drizzle.config.ts\`.

- **Add or change a table:** edit the schema in \`database/drizzle/schema/\`.
- **Generate a migration:** \`${run} drizzle:generate\`.
- **Apply migrations:** \`${apply}\`.
- **Write queries:** add functions in \`database/drizzle/queries/\`; on the server the db is available as \`context.db\`.
- **Inspect data:** \`${run} drizzle:studio\`.

See https://orm.drizzle.team.`,
      },
    ];
  },
});
