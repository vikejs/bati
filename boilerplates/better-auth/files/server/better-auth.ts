//# BATI.has("cloudflare")
import { env as cloudflareEnv } from "cloudflare:workers";
import type { RuntimeAdapter } from "@universal-middleware/core";
import type { BetterAuthOptions } from "better-auth";
import Database from "better-sqlite3";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";

const env: BATI.If<{ '!BATI.has("cloudflare")': Record<string, string | undefined> }> = BATI.has("cloudflare")
  ? (cloudflareEnv as BATI.Any)
  : typeof process?.env !== "undefined"
    ? process.env
    : {};

//# BATI.hasD1
function getD1(runtime?: RuntimeAdapter): D1Database {
  if (runtime?.runtime === "workerd" && runtime.env) {
    return runtime.env.DB as D1Database;
  }
  throw new Error("Cloudflare D1 binding (DB) is not available");
}

// Better Auth keeps its own tables (user/session/account/verification) via its built-in adapter,
// so it only needs the engine — independent of whatever ORM the app uses for its own data.
function getDatabase(_runtime?: RuntimeAdapter): BetterAuthOptions["database"] {
  if (BATI.hasD1) {
    // Cloudflare D1 is the SQLite engine on Workers, reached through Kysely's D1 dialect.
    return {
      db: new Kysely({ dialect: new D1Dialect({ database: getD1(_runtime) }) }),
      type: "sqlite" as const,
    };
  } else if (BATI.has("postgres")) {
    // postgres.js via Kysely's dialect — the same driver the rest of the app uses (and Bun-friendly).
    return {
      db: new Kysely({ dialect: new PostgresJSDialect({ postgres: postgres(env.DATABASE_URL ?? "") }) }),
      type: "postgres" as const,
    };
  } else {
    // SQLite via better-sqlite3 (also used when Drizzle/Kysely/Prisma sit on top of SQLite).
    // Prisma-style `file:` URLs are normalized to a plain path.
    return new Database((env.DATABASE_URL ?? "").replace(/^file:/, ""));
  }
}

export function getAuthConfig(runtime?: RuntimeAdapter): BetterAuthOptions {
  return {
    secret: env.BETTER_AUTH_SECRET,
    database: getDatabase(runtime),
    emailAndPassword: {
      enabled: true,
    },
    // GitHub is only enabled once its credentials are set, so the app runs out of the box without them.
    socialProviders:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {},
  };
}
