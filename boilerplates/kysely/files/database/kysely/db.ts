import "dotenv/config";
import type { Database } from "./types";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const dialect = new SqliteDialect({
  database: new SQLite(process.env.DATABASE_URL),
});

export const dbKysely = new Kysely<Database>({
  dialect,
});
