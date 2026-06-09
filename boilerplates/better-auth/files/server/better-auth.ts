import { env as cloudflareEnv } from "cloudflare:workers";
import { dbD1, dbPostgres, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { RuntimeAdapter } from "@universal-middleware/core";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Database from "better-sqlite3";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import * as authSchema from "../database/drizzle/schema/auth";

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

//# BATI.has("drizzle")
function getDrizzleDb(_runtime?: RuntimeAdapter) {
  if (BATI.hasD1) {
    return dbD1(getD1(_runtime));
  } else if (BATI.has("postgres")) {
    return dbPostgres();
  } else {
    return dbSqlite();
  }
}

// Better Auth keeps its own tables (user/session/account/verification) so it only needs the engine.
// With Drizzle it reuses the app's instance (Drizzle owns the schema + migrations); otherwise it
// opens its own connection and creates the tables via `better-auth:migrate` (or a D1 SQL migration).
function getDatabase(_runtime?: RuntimeAdapter): BetterAuthOptions["database"] {
  if (BATI.has("drizzle")) {
    return drizzleAdapter(getDrizzleDb(_runtime), {
      provider: BATI.has("postgres") ? "pg" : "sqlite",
      schema: authSchema,
    });
  } else if (BATI.hasD1) {
    // Cloudflare D1 is the SQLite engine on Workers, reached through Kysely's D1 dialect.
    return {
      db: new Kysely({ dialect: new D1Dialect({ database: getD1(_runtime) }) }),
      type: "sqlite" as const,
    };
  } else if (BATI.has("postgres")) {
    // postgres.js via Kysely's dialect — the same driver the rest of the app uses (and Bun-friendly).
    if (!env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }
    return {
      db: new Kysely({ dialect: new PostgresJSDialect({ postgres: postgres(env.DATABASE_URL) }) }),
      type: "postgres" as const,
    };
  } else {
    // SQLite via better-sqlite3. Prisma-style `file:` URLs are normalized to a plain path.
    if (!env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL in .env file");
    }
    return new Database(env.DATABASE_URL.replace(/^file:/, ""));
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
