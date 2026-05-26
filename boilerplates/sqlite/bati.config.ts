import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("sqlite") && !meta.BATI.has("cloudflare");
  },
  env: [
    {
      key: "DATABASE_URL",
      scope: "server-default",
      comment: "Path to the sqlite database",
      default: "sqlite.db",
      perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
      group: "non-D1 database",
      when: ({ meta }) => !meta.BATI.hasD1,
    },
  ],
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} sqlite:migrate`,
      },
    ];
  },
});
