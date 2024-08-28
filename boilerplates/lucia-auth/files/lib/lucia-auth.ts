import "dotenv/config";
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { GitHub } from "arctic";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { db as drizzleDb } from "@batijs/drizzle/database/drizzle/db";
import { sessionTable, userTable } from "@batijs/drizzle/database/drizzle/schema/lucia-auth";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";

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

/**
 * Database setup
 *
 * @link {@see https://lucia-auth.com/database/#database-setup}
 **/
const adapter = BATI.has("drizzle")
  ? new DrizzleSQLiteAdapter(drizzleDb(), sessionTable, userTable)
  : new BetterSqlite3Adapter(sqliteDb(), {
      user: "users",
      session: "sessions",
    });

/**
 * Initialize Lucia
 *
 * @link {@see https://lucia-auth.com/getting-started/#initialize-lucia}
 */
export const lucia = new Lucia(adapter, {
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

/**
 * Initialize OAuth provider
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#initialize-oauth-provider}
 */
export const github = new GitHub(process.env.GITHUB_CLIENT_ID as string, process.env.GITHUB_CLIENT_SECRET as string);

/**
 * Define user attributes
 *
 * @link {@see https://lucia-auth.com/basics/users#define-user-attributes}
 */
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<DatabaseUser, "id">;
  }
}

export interface DatabaseUser {
  id: string;
  username: string;
  password?: string;
}

export interface DatabaseOAuthAccount {
  provider_id: string;
  provider_user_id: string;
  /*{ @if (it.BATI.has("drizzle")) }*/
  userId: string;
  /*{ #else }*/
  user_id: string;
  /*{ /if }*/
}

export interface GitHubUser {
  id: number;
  login: string; // username
}
