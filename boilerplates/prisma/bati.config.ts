import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prisma");
  },
  env: [
    {
      key: "DATABASE_URL",
      scope: "server-default",
      // Prisma manages its own connection string; it is not part of the container env.
      when: ({ sink }) => sink === "dotenv",
      default: "postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public",
      comment: `Prisma

Environment variables declared in this file are automatically made available to Prisma.
See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
See the documentation for all the connection string options: https://pris.ly/d/connection-strings`,
    },
  ],
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} prisma init --db`,
      },
      {
        type: "text",
        step: `Then follow instructions at https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres`,
      },
    ];
  },
  knip: {
    ignoreDependencies: ["@prisma/client", "prisma"],
  },
});
