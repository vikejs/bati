import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("kysely");
  },
  // The runtime migration runner (dist/server/migrate.mjs) reads these off disk via
  // FileMigrationProvider, so the migration sources must ship into the production runner.
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
});
