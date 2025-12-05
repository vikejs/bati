import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { dbKysely, dbKyselyD1 } from "@batijs/kysely/database/kysely/db";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";

//# BATI.hasDatabase
declare global {
  namespace Vike {
    interface PageContextServer {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        'BATI.has("kysely") && !BATI.hasD1': ReturnType<typeof dbKysely>;
        'BATI.has("kysely")': ReturnType<typeof dbKyselyD1>;
        "BATI.hasD1": D1Database;
      }>;
    }
  }
}
