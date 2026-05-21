/*# BATI include-if-imported #*/
import { Database } from "bun:sqlite";

let singleton: Database | undefined;

export function db(): Database {
  if (!singleton) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }

    singleton = new Database(process.env.DATABASE_URL);
  }
  return singleton;
}
