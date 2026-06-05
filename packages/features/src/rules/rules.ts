import { RulesMessage } from "./enum.js";
import { exclusive, filter, type Rule, requires } from "./utils.js";

// Defines all rules such as
// - conflicts between packages
// - missing dependencies between packages
// - particular status of one or multiple package
export default [
  requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]),
  requires(RulesMessage.ERROR_BETTER_AUTH_R_DATABASE, "better-auth", ["Database"]),
  // TEMPORARY: better-auth's Kysely adapter imports migration constants from "kysely" that kysely 0.29
  // moved to "kysely/migration". Until the fix ships (https://github.com/better-auth/better-auth/commit/0933c050),
  // better-auth can't be paired with Kysely, and can't be bundled for Cloudflare/D1 (where the adapter's
  // SQLite dialects get bundled into the Worker). Remove both rules once the fixed better-auth is adopted.
  exclusive(RulesMessage.ERROR_BETTER_AUTH_X_KYSELY, ["better-auth", "kysely"]),
  exclusive(RulesMessage.ERROR_BETTER_AUTH_X_CLOUDFLARE, ["better-auth", "cloudflare"]),
  requires(RulesMessage.ERROR_COMPILED_R_REACT, "compiled-css", ["react"]),
  requires(RulesMessage.ERROR_DRIZZLE_R_SERVER, "drizzle", ["Server"]),
  requires(RulesMessage.ERROR_SQLITE_R_SERVER, "sqlite", ["Server"]),
  requires(RulesMessage.ERROR_KYSELY_R_SERVER, "kysely", ["Server"]),
  requires(RulesMessage.ERROR_POSTGRES_R_SERVER, "postgres", ["Server"]),
  exclusive(RulesMessage.ERROR_POSTGRES_X_SQLITE, ["postgres", "sqlite"]),
  requires(RulesMessage.ERROR_ORM_R_DATABASE, "drizzle", ["Database"]),
  requires(RulesMessage.ERROR_ORM_R_DATABASE, "kysely", ["Database"]),
  requires(RulesMessage.ERROR_ORM_R_DATABASE, "prisma", ["Database"]),
  requires(RulesMessage.ERROR_DATA_R_SERVER, "Data fetching", ["Server"]),
  filter(RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER, (fts) => {
    if (fts.has("cloudflare")) {
      if (fts.has("hono")) {
        return false;
      }

      // If it has any other server, return the message
      return fts.has("Server");
    }

    return false;
  }),
  filter(RulesMessage.ERROR_AWS_R_COMPAT_SERVER, (fts) => {
    if (fts.has("aws")) {
      if (fts.has("hono")) {
        return false;
      }

      // If it has any other server or none, return the message
      return true;
    }

    return false;
  }),
  filter(RulesMessage.ERROR_MANTINE_R_REACT, (fts) => {
    if (fts.has("mantine")) {
      return fts.has("vue") || fts.has("solid");
    }

    return false;
  }),
  filter(RulesMessage.ERROR_SHADCN_R_REACT, (fts) => {
    if (fts.has("shadcn-ui")) {
      return fts.has("vue") || fts.has("solid");
    }

    return false;
  }),
  filter(RulesMessage.WARN_SHADCN_R_TAILWINDCSS, (fts) => {
    if (fts.has("shadcn-ui")) {
      return fts.has("daisyui") || fts.has("compiled-css");
    }

    return false;
  }),
  filter(RulesMessage.INFO_STACKBLITZ_COMPAT, (fts) => {
    return fts.has("drizzle") || fts.has("sqlite") || fts.has("kysely") || fts.has("postgres") || fts.has("cloudflare");
  }),
  filter(RulesMessage.ERROR_STORYBOOK_R_UI_FRAMEWORK, (fts) => {
    if (fts.has("storybook")) {
      return !fts.has("react") && !fts.has("vue") && !fts.has("solid");
    }
    return false;
  }),
] satisfies Rule[];
