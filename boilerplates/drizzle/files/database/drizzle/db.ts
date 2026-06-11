import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

//# $$.BATI.has("sqlite") && !$$.BATI.hasD1
export function dbSqlite() {
  const sqlite = new Database(process.env.DATABASE_URL);
  return drizzleSqlite(sqlite);
}

//# $$.BATI.hasD1
export function dbD1(d1: D1Database) {
  return drizzleD1(d1);
}

//# $$.BATI.has("postgres")
export function dbPostgres() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env file");
  }
  return drizzlePostgres(postgres(process.env.DATABASE_URL));
}
