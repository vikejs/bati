import type { D1Database } from "@cloudflare/workers-types";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";

//# !BATI.hasD1
export function dbSqlite() {
  const sqlite = new Database(process.env.DATABASE_URL);
  return drizzleSqlite(sqlite);
}

//# BATI.hasD1
export function dbD1(d1: D1Database) {
  return drizzleD1(d1);
}
