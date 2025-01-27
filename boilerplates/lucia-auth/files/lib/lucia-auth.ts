import "dotenv/config";
import { Lucia, type Register } from "lucia";
import { BetterSqlite3Adapter, D1Adapter } from "@lucia-auth/adapter-sqlite";
import { GitHub } from "arctic";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import { sessionTable, userTable } from "@batijs/drizzle/database/drizzle/schema/lucia-auth";
import { D1Database } from "@cloudflare/workers-types";

/**
 * Polyfill needed if you're using Node.js 18 or below
 *
 * @link {@see https://lucia-auth.com/getting-started/#polyfill}
 */
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: await import("node:crypto").then((crypto) => crypto.webcrypto as Crypto),
    writable: false,
    configurable: true,
  });
}

export function initializeLucia(
  db: BATI.If<
    {
      'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
      'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
      'BATI.has("drizzle")': ReturnType<typeof dbD1>;
      "BATI.hasD1": D1Database;
    },
    "union"
  >,
) {
  /**
   * Database setup
   *
   * @link {@see https://lucia-auth.com/database/#database-setup}
   **/
  const adapter = BATI.has("drizzle")
    ? new DrizzleSQLiteAdapter(db as BATI.Any, sessionTable as BATI.Any, userTable as BATI.Any)
    : BATI.hasD1
      ? new D1Adapter(db as BATI.Any, {
          user: "users",
          session: "sessions",
        })
      : new BetterSqlite3Adapter(db as BATI.Any, {
          user: "users",
          session: "sessions",
        });

  /**
   * Initialize Lucia
   *
   * @link {@see https://lucia-auth.com/getting-started/#initialize-lucia}
   */
  return new Lucia(adapter, {
    /**
     * Lucia Configuration
     *
     * @link {@see https://lucia-auth.com/basics/configuration}
     */
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === "production",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        username: attributes.username,
      };
    },
  });
}

/**
 * Initialize OAuth provider
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#initialize-oauth-provider}
 */
export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID as string,
  process.env.GITHUB_CLIENT_SECRET as string,
  null,
);

/**
 * Define user attributes
 *
 * @link {@see https://lucia-auth.com/basics/users#define-user-attributes}
 */
declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: Omit<DatabaseUser, "id">;
  }
}

declare global {
  namespace Universal {
    interface Context {
      lucia: Register["Lucia"];
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        "BATI.hasD1": D1Database;
      }>;
    }
  }
}

export interface DatabaseUser {
  id: string;
  username: string;
  password?: string | null;
}

//# !BATI.has("drizzle")
export interface DatabaseOAuthAccount {
  provider_id: string;
  provider_user_id: string;
  user_id: string;
}

//# BATI.has("drizzle")
export interface DatabaseOAuthAccount {
  providerId: string;
  providerUserId: string;
  userId: string;
}

export interface GitHubUser {
  id: number;
  login: string; // username
}
