import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prisma");
  },
  // Prisma owns its own connection string, shaped by the chosen engine.
  env: (meta) => [
    {
      key: "DATABASE_URL",
      scope: "server-default",
      default: meta.BATI.has("postgres")
        ? "postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
        : "file:./dev.db",
      comment: `Prisma connection string — see https://pris.ly/d/connection-strings`,
    },
  ],
  nextSteps(meta, packageManager) {
    const provider = meta.BATI.has("postgres") ? "postgresql" : "sqlite";
    return [
      {
        type: "command",
        step: `${packageManager} prisma init --datasource-provider ${provider}`,
      },
      {
        type: "text",
        step: `Then define your models and run ${packageManager} prisma migrate dev — https://www.prisma.io/docs/getting-started`,
      },
    ];
  },
  knip: {
    ignoreDependencies: ["@prisma/client", "prisma"],
  },
  // ORM skill (SKILLS_PLAN.md §6.I) — dynamic on the selected engine (§9).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    const provider = meta.BATI.has("postgres") ? "postgresql" : "sqlite";
    return [
      {
        name: "prisma",
        description:
          "How to work with the database via Prisma in this app. Use when defining a model, running a migration, or querying with the Prisma client.",
        body: `Prisma (self-managed) on ${provider}. It uses the \`DATABASE_URL\` in \`.env\`.

- **First-time setup:** \`${run} prisma init --datasource-provider ${provider}\` (creates \`prisma/schema.prisma\`).
- **Add or change a model:** edit \`prisma/schema.prisma\`.
- **Create & apply a migration:** \`${run} prisma migrate dev\`.
- **Generate the client / inspect data:** \`${run} prisma:generate\` / \`${run} prisma:studio\`.
- **Query:** \`import { PrismaClient } from "@prisma/client"\`.

See https://www.prisma.io/docs.`,
      },
    ];
  },
});
