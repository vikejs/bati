import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { dbKysely, dbKyselyD1 } from "@batijs/kysely/database/kysely/db";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";

//# BATI.hasDatabase
declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        'BATI.has("kysely") && !BATI.hasD1': ReturnType<typeof dbKysely>;
        'BATI.has("kysely")': ReturnType<typeof dbKyselyD1>;
        "BATI.hasD1": D1Database;
        _: object;
      }>;
    }
  }
}

//# BATI.has("REMOVE-COMMENT") || "remove-comments-only"
// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module
export {};
