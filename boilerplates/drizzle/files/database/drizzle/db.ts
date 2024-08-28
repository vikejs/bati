import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";

let singleton: BetterSQLite3Database | undefined = undefined;

export function db() {
  if (!singleton) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }

    const sqlite = new Database(process.env.DATABASE_URL);
    singleton = drizzle(sqlite);
  }
  return singleton;
}
