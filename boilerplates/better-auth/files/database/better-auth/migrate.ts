// $$.keepFileIf(!$$.BATI.hasD1 && !$$.BATI.has("drizzle"))
import "@batijs/shared-env/server/load";
import { getMigrations } from "better-auth/db/migration";
import { getAuthConfig } from "../../server/better-auth";

// Creates / updates Better Auth's tables (`user`, `session`, `account`, `verification`) using its
// built-in Kysely adapter. Run with `better-auth:migrate`.
// Note: with Drizzle or on Cloudflare D1 this script is not generated — Drizzle's schema or a wrangler
// D1 migration creates the tables instead.
const { runMigrations } = await getMigrations(getAuthConfig());

await runMigrations();

console.log("Better Auth tables are up to date");

// The database driver keeps the event loop alive (e.g. Postgres connection pool); exit explicitly
// so this one-shot script terminates instead of hanging.
process.exit(0);
