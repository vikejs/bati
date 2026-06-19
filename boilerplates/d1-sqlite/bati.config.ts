import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw D1 queries: the SQLite engine on Cloudflare with no ORM/query builder.
    return meta.BATI.hasD1 && !meta.BATI.hasOrm;
  },
  // Raw DB-engine skill (SKILLS_PLAN.md §6.H) — Cloudflare D1, no ORM (the sqlite boilerplate's
  // 'database' skill is off-Cloudflare, so D1 needs its own).
  skills(meta) {
    const run = meta.BATI.pmRun;
    return [
      {
        name: "database",
        description:
          "How to work with the database in this app (raw Cloudflare D1 / SQLite, no ORM). Use when querying, adding a table, or migrating.",
        body: `Raw Cloudflare D1 (SQLite) with no ORM. Queries are in \`database/d1/queries/\`; SQL migrations in \`database/migrations/\`. The D1 binding is \`DB\`, available on the server as \`context.db\` (a \`D1Database\`).

- **Add a table:** add a \`.sql\` migration to \`database/migrations/\`, then apply it with \`${run} d1:migrate\` (locally) or \`wrangler d1 migrations apply <name>\`.
- **Write queries:** add functions in \`database/d1/queries/\` using D1's prepared-statement API, e.g. \`db.prepare("SELECT * FROM todos").all()\` or \`db.prepare("INSERT INTO todos (text) VALUES (?)").bind(text).run()\`.

See https://developers.cloudflare.com/d1.`,
      },
    ];
  },
});
