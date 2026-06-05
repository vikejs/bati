/*{ @if (!it.BATI.hasD1) }*/

import "dotenv/config";
import { getMigrations } from "better-auth/db/migration";
import { getAuthConfig } from "../../server/better-auth";

// Creates / updates Better Auth's tables (`user`, `session`, `account`, `verification`) using its
// built-in Kysely adapter. Run with `better-auth:migrate`.
// Note: on Cloudflare D1 this script is not generated — apply the tables via wrangler migrations instead.
const { runMigrations } = await getMigrations(getAuthConfig());

await runMigrations();

console.log("Better Auth tables are up to date");
/*{ /if }*/
