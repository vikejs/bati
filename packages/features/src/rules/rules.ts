import { RulesMessage } from "./enum.js";
import { includes, requires, type Rule } from "./utils.js";

// Defines all rules such as
// - conflicts between packages
// - missing dependencies between packages
// - particular status of one or multiple package
export default [
  requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]),
  requires(RulesMessage.ERROR_COMPILED_R_REACT, "compiled", ["react"]),
  includes(RulesMessage.INFO_HATTIP, "hattip"),
] satisfies Rule[];
