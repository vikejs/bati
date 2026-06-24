import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw better-sqlite3 client: the SQLite engine with no ORM/query builder, off Cloudflare (D1).
    return meta.BATI.has("sqlite") && !meta.BATI.hasOrm && !meta.BATI.has("cloudflare");
  },
  // Schema script runs as raw source at container startup and imports server/load.ts.
  deploy: ["database/sqlite", "server/load.ts"],
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} sqlite:migrate`,
      },
    ];
  },
});
