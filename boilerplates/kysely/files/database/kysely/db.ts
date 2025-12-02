/*# BATI include-if-imported #*/

// !BATI.hasD1
import "dotenv/config";
import type { Database } from "./types";
// !BATI.hasD1
import SQLite from "better-sqlite3";
// BATI.hasD1
import { D1Dialect } from "kysely-d1";
import { Kysely, SqliteDialect } from "kysely";

//# !BATI.hasD1
export function dbKysely() {
  //# !BATI.hasD1
  const dialect = new SqliteDialect({
    //# !BATI.hasD1
    database: new SQLite(process.env.DATABASE_URL),
    //# !BATI.hasD1
  });
  //# !BATI.hasD1
  return new Kysely<Database>({
    //# !BATI.hasD1
    dialect,
    //# !BATI.hasD1
  });
  //# !BATI.hasD1
}

//# BATI.hasD1
export function dbKyselyD1(d1: D1Database) {
  //# BATI.hasD1
  return new Kysely<Database>({
    //# BATI.hasD1
    dialect: new D1Dialect({ database: d1 }),
    //# BATI.hasD1
  });
  //# BATI.hasD1
}
