//# BATI.has("cloudflare")
import { env as cloudflareEnv } from "cloudflare:workers";
import type { RuntimeAdapter } from "@universal-middleware/core";
import type { BetterAuthOptions } from "better-auth";
//# BATI.has("sqlite") && !BATI.hasD1
import Database from "better-sqlite3";
//# BATI.hasD1 || BATI.has("postgres")
import { Kysely } from "kysely";
//# BATI.hasD1
import { D1Dialect } from "kysely-d1";
//# BATI.has("postgres")
import { PostgresJSDialect } from "kysely-postgres-js";
//# BATI.has("postgres")
import postgres from "postgres";

const env: BATI.If<{ '!BATI.has("cloudflare")': Record<string, string | undefined> }> = BATI.has("cloudflare")
  ? (cloudflareEnv as BATI.Any)
  : typeof process?.env !== "undefined"
    ? process.env
    : {};

//# BATI.hasD1
function getD1(runtime: RuntimeAdapter): D1Database {
  if (runtime.runtime === "workerd" && runtime.env) {
    return runtime.env.DB as D1Database;
  }
  throw new Error("Cloudflare D1 binding (DB) is not available");
}

/**
 * Resolve the database Better Auth talks to. Better Auth manages its own tables (`user`, `session`,
 * `account`, `verification`) through its built-in Kysely adapter, so it works on top of whichever
 * database/ORM the app uses for the rest of its data: it only needs the underlying engine.
 */
function getDatabase(_runtime?: RuntimeAdapter) {
  if (BATI.hasD1) {
    // Cloudflare D1 is the SQLite engine on Workers, reached through Kysely's D1 dialect.
    return {
      db: new Kysely({ dialect: new D1Dialect({ database: getD1(_runtime!) }) }),
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

/**
 * Better Auth configuration.
 * @link {@see https://better-auth.com/docs/reference/options}
 */
export function getAuthConfig(runtime?: RuntimeAdapter): BetterAuthOptions {
  return {
    // TODO: Replace the secret in production {@see https://better-auth.com/docs/reference/options#secret}
    secret: env.BETTER_AUTH_SECRET ?? "dev-secret-please-change-me-in-production",
    baseURL: env.BETTER_AUTH_URL,
    database: getDatabase(runtime) as BetterAuthOptions["database"],
    emailAndPassword: {
      enabled: true,
    },
    // The GitHub provider is only enabled when its credentials are set, so the app keeps working
    // out of the box (and in CI) without OAuth secrets. {@see TODO.md}
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
