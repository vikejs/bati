/*# BATI include-if-imported #*/

import "dotenv/config";
import type { Database } from "./types";
import SQLite from "better-sqlite3";
import { D1Dialect } from "kysely-d1";
import { Kysely, SqliteDialect } from "kysely";

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
