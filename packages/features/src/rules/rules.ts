import { RulesMessage } from "./enum.js";
import { filter, includes, requires, type Rule } from "./utils.js";

// Defines all rules such as
// - conflicts between packages
// - missing dependencies between packages
// - particular status of one or multiple package
export default [
  requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]),
  requires(RulesMessage.ERROR_COMPILED_R_REACT, "compiled-css", ["react"]),
  requires(RulesMessage.ERROR_MANTINE_R_REACT, "mantine", ["react"]),
  includes(RulesMessage.INFO_HATTIP, "hattip"),
  requires(RulesMessage.ERROR_DRIZZLE_R_SERVER, "drizzle", ["Server"]),
  requires(RulesMessage.ERROR_DATA_R_SERVER, "Data fetching", ["Server"]),
  filter(RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER, (fts) => {
    if (fts.has("cloudflare")) {
      if (fts.has("hono") || fts.has("hattip")) {
        return false;
      }

      // If it has any other server, return the message
      return fts.has("Server");
    }

    return false;
  }),
  filter(RulesMessage.ERROR_AWS_R_COMPAT_SERVER, (fts) => {
    if (fts.has("aws")) {
      if (fts.has("hono") || fts.has("hattip")) {
        return false;
      }

      // If it has any other server, return the message
      return fts.has("Server");
    }

    return false;
  }),
  filter(RulesMessage.ERROR_LUCIA_R_COMPAT_DATABASE, (fts) => {
    if (fts.has("lucia-auth")) {
      return !(fts.has("sqlite") || fts.has("drizzle"));
    }

    return false;
  }),
  filter(RulesMessage.ERROR_SHADCN_R_REACT, (fts) => {
    if (fts.has("shadcn-ui")) {
      return fts.has("vue") || fts.has("solid") || fts.has("daisyui") || fts.has("mantine");
    }

    return false;
  }),
  // TODO: sqlite does not work on stackblitz either
  includes(RulesMessage.INFO_DRIZZLE_STACKBLITZ, "drizzle"),
] satisfies Rule[];
