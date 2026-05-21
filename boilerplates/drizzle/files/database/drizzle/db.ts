import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";

//# !BATI.hasD1
export function dbSqlite() {
  const sqlite = new Database(process.env.DATABASE_URL);
  const db = drizzleSqlite(sqlite);
  migrateSqlite(db, {
    migrationsFolder: "./database/migrations",
  });
  return db;
}

//# BATI.hasD1
export function dbD1(d1: D1Database) {
  return drizzleD1(d1);
}
