/*# BATI include-if-imported #*/

//# !BATI.hasD1
import "dotenv/config";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Database } from "./types";

//# !BATI.hasD1
export function dbKysely() {
  const dialect = new SqliteDialect({
    database: new SQLite(process.env.DATABASE_URL),
  });
  return new Kysely<Database>({
    dialect,
  });
}

//# BATI.hasD1
export function dbKyselyD1(d1: D1Database) {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  });
}
