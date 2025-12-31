import { RulesMessage } from "./enum.js";
import { filter, type Rule, requires } from "./utils.js";

// Defines all rules such as
// - conflicts between packages
// - missing dependencies between packages
// - particular status of one or multiple package
export default [
  requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]),
  requires(RulesMessage.ERROR_COMPILED_R_REACT, "compiled-css", ["react"]),
  requires(RulesMessage.ERROR_DRIZZLE_R_SERVER, "drizzle", ["Server"]),
  requires(RulesMessage.ERROR_KYSELY_R_SERVER, "kysely", ["Server"]),
  requires(RulesMessage.ERROR_DATA_R_SERVER, "Data fetching", ["Server"]),
  filter(RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER, (fts) => {
    if (fts.has("cloudflare")) {
      if (fts.has("hono") || fts.has("h3")) {
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
  filter(RulesMessage.ERROR_VIKE_REACT_QUERY_R_REACT, (fts) => {
    if (fts.has("react-query")) {
      return !fts.has("react");
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
    return fts.has("drizzle") || fts.has("sqlite") || fts.has("kysely") || fts.has("cloudflare");
  }),
] satisfies Rule[];
