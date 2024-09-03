import { D1Database } from "@cloudflare/workers-types";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";

//# BATI.hasDatabase
declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        "BATI.hasD1": D1Database;
        _: object;
      }>;
    }
  }
}

export {};
