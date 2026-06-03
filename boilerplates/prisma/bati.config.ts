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
});
