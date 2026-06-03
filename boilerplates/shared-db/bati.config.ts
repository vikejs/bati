import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.hasDbDemo;
  },
  // DATABASE_URL is shared by every non-D1 database tool (sqlite/drizzle/kysely/postgres);
  // under D1 the binding replaces it. Prisma ships its own connection string.
  env: (meta) => {
    if (meta.BATI.hasD1) return [];

    if (meta.BATI.has("postgres")) {
      // In Docker, the app connects to the `postgres` compose service (host `postgres`);
      // locally it defaults to a Postgres server on localhost.
      return [
        {
          key: "DATABASE_URL",
          scope: "server-default",
          comment: "PostgreSQL connection string",
          default: "postgresql://postgres:postgres@localhost:5432/app",
          perSink: {
            compose: "postgresql://postgres:postgres@postgres:5432/app",
            dockerfile: "postgresql://postgres:postgres@postgres:5432/app",
          },
          group: "postgres database",
        },
      ];
    }

    return [
      {
        key: "DATABASE_URL",
        scope: "server-default",
        comment: "Path to the database",
        default: "sqlite.db",
        perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
        group: "non-D1 database",
      },
    ];
  },
});
