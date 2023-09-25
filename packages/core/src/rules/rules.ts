import { RulesMessage } from "./enum";
import { includes, requires, type Rule } from "./utils";

// Defines all rules such as
// - conflicts between packages
// - missing dependencies between packages
// - particular status of one or multiple package
export default [
  requires(RulesMessage.ERROR_AUTH_R_SERVER, "auth", ["server"]),
  includes(RulesMessage.INFO_HATTIP, "server:hattip"),
] satisfies Rule[];
