import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw better-sqlite3 client: the SQLite engine with no ORM/query builder, off Cloudflare (D1).
    return meta.BATI.has("sqlite") && !meta.BATI.hasOrm && !meta.BATI.has("cloudflare");
  },
  // The schema script runs as raw source in the production runner and imports the shared env loader.
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
