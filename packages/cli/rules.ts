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
    )}. Check https://vike.dev/integration#server-side-tools for details and https://batijs.dev for available servers`,
  ),
  [RulesMessage.ERROR_COMPILED_R_REACT]: error(
    `${inverse(bold("React"))} is required when using ${inverse(bold("Compiled"))}`,
  ),
  [RulesMessage.ERROR_MANTINE_R_REACT]: error(
    `${inverse(bold("React"))} is required when using ${inverse(bold("Mantine"))}`,
  ),
  [RulesMessage.INFO_HATTIP]: info(`${inverse(bold("HatTip"))} is an experimental project`),
  [RulesMessage.ERROR_DRIZZLE_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(bold("Drizzle"))}`,
  ),
  [RulesMessage.ERROR_DATA_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(bold("Data fetching"))}`,
  ),
  [RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER]: error(
    `${inverse(bold("Cloudflare"))} is only compatible with ${inverse(bold("Hono"))} or ${inverse(bold("HatTip"))}.
Choose one of them, or simply remove selected Server`,
  ),
  [RulesMessage.ERROR_LUCIA_R_COMPAT_DATABASE]: error(
    `${inverse(bold("Lucia"))} requires a ${inverse(bold("Database"))}, and is only compatible with ${inverse(bold("SQLite"))} or ${inverse(bold("Drizzle"))}`,
  ),
  [RulesMessage.ERROR_SHADCN_R_REACT]: error(
    `${inverse(bold("shadcn/ui"))} is only compatible with ${inverse(bold("React"))}. No other UI libraries can be combined with it!`,
  ),
  [RulesMessage.INFO_DRIZZLE_STACKBLITZ]: null,
} satisfies Record<RulesMessage, RuleMessage | null>;
