import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    // Raw D1 queries: the SQLite engine on Cloudflare with no ORM/query builder.
    return meta.BATI.hasD1 && !meta.BATI.hasOrm;
  },
});
