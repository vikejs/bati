/*# $$.includeIfImported #*/
import postgres from "postgres";

let singleton: postgres.Sql | undefined;

export function db(): postgres.Sql {
  if (!singleton) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }

    singleton = postgres(process.env.DATABASE_URL);
  }
  return singleton;
}
