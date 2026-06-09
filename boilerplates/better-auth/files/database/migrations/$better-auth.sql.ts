import type { TransformerProps } from "@batijs/core";

// Cloudflare D1 without an ORM: Better Auth's CLI cannot reach the D1 binding, so its core tables are
// shipped as a wrangler D1 migration (applied by `d1:migrate` / `d1:deploy`). With Drizzle the schema
// owns these tables instead (see ../drizzle/schema/auth.ts); on other engines the `better-auth:migrate`
// script creates them programmatically.
// Column types follow Better Auth's SQLite mapping (string→text, boolean→integer, date→date).
// Keep in sync with `npx @better-auth/cli generate` if you customize the Better Auth config.
export default function getMigration(props: TransformerProps): string | undefined {
  if (!props.meta.BATI.hasD1 || props.meta.BATI.has("drizzle")) return undefined;

  //language=SQL
  return `CREATE TABLE IF NOT EXISTS "user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL DEFAULT 0,
  "image" text,
  "createdAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" date NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id")
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" date,
  "refreshTokenExpiresAt" date,
  "scope" text,
  "password" text,
  "createdAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" date NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" date NOT NULL,
  "createdAt" date DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" date DEFAULT CURRENT_TIMESTAMP
);
`;
}
