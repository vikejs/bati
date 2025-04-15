import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import { dbKysely } from "@batijs/kysely/database/kysely/db";
import { D1Database } from "@cloudflare/workers-types";

//# BATI.hasDatabase
declare global {
  namespace Vike {
    interface PageContext {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        'BATI.has("kysely")': typeof dbKysely;
        "BATI.hasD1": D1Database;
      }>;
    }
  }
}

export {};
