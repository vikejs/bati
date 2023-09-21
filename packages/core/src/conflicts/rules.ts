import { requires, type Rule } from "./utils";
import { RulesMessage } from "./enum";

export default [requires(RulesMessage.AUTH_R_SERVER, "auth", ["server"])] satisfies Rule[];
