/*# BATI include-if-imported #*/
import postgres from "postgres";

let singleton: postgres.Sql | undefined;

/**
 * Returns a shared postgres.js client.
 *
 * By default the connection string is read from `DATABASE_URL`. A connection
 * string can also be passed explicitly — e.g. on Cloudflare Workers, where it
 * comes from a Hyperdrive binding rather than `process.env`.
 */
export function db(connectionString: string | undefined = process.env.DATABASE_URL): postgres.Sql {
  if (!singleton) {
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL in .env file");
    }

    singleton = postgres(connectionString);
  }
  return singleton;
}
