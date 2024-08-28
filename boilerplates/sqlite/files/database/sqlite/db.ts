/*# BATI include-if-imported #*/
import sqlite, { type Database } from "better-sqlite3";

let singleton: Database | undefined = undefined;

export function db(): Database {
  if (!singleton) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }

    singleton = sqlite(process.env.DATABASE_URL);
  }
  return singleton;
}
