import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.hasDatabase;
  },
  // DATABASE_URL is shared by every non-D1 database tool (sqlite/drizzle/kysely);
  // under D1 the binding replaces it. Prisma ships its own connection string.
  env: (meta) =>
    meta.BATI.hasD1
      ? []
      : [
          {
            key: "DATABASE_URL",
            scope: "server-default",
            comment: "Path to the database",
            default: "sqlite.db",
            perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
            group: "non-D1 database",
          },
        ],
});
