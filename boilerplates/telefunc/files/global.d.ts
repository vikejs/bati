import type { dbD1, dbPostgres, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { dbKysely, dbKyselyD1, dbKyselyPostgres } from "@batijs/kysely/database/kysely/db";
import type { db as pgDb } from "@batijs/postgres/database/postgres/db";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";

//# $$.BATI.hasDbDemo
declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      db: $$.If<{
        '$$.BATI.has("drizzle") && $$.BATI.has("postgres")': ReturnType<typeof dbPostgres>;
        '$$.BATI.has("kysely") && $$.BATI.has("postgres")': ReturnType<typeof dbKyselyPostgres>;
        '$$.BATI.has("postgres") && !$$.BATI.hasOrm': ReturnType<typeof pgDb>;
        '$$.BATI.has("sqlite") && !$$.BATI.hasD1 && !$$.BATI.hasOrm': ReturnType<typeof sqliteDb>;
        '$$.BATI.has("drizzle") && !$$.BATI.hasD1': ReturnType<typeof dbSqlite>;
        '$$.BATI.has("drizzle")': ReturnType<typeof dbD1>;
        '$$.BATI.has("kysely") && !$$.BATI.hasD1': ReturnType<typeof dbKysely>;
        '$$.BATI.has("kysely")': ReturnType<typeof dbKyselyD1>;
        "$$.BATI.hasD1 && !$$.BATI.hasOrm": D1Database;
      }>;
    }
  }
}

//# $$.BATI.has("REMOVE-COMMENT") || "remove-comments-only"
// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module
export {};
