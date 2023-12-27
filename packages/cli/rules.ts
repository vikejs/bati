import { RulesMessage } from "@batijs/features/rules";
import { bold, inverse } from "colorette";

export interface RuleMessage {
  type: "warning" | "error" | "info";
  value: string;
}

function error(value: string): RuleMessage {
  return {
    type: "error",
    value,
  };
}

function info(value: string): RuleMessage {
  return {
    type: "info",
    value,
  };
}

export const rulesMessages = {
  [RulesMessage.ERROR_AUTH_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(
      bold("Auth"),
    )}. Check https://vite-plugin-ssr.com/integration#server-side-tools for details and https://batijs.github.io for available servers`,
  ),
  [RulesMessage.ERROR_COMPILED_R_REACT]: error(
    `${inverse(bold("React"))} is required when using ${inverse(bold("Compiled"))}.`,
  ),
  [RulesMessage.INFO_HATTIP]: info(`${inverse(bold("HatTip"))} is an experimental project`),
} satisfies Record<RulesMessage, RuleMessage>;
