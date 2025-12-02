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

function warning(value: string): RuleMessage {
  return {
    type: "warning",
    value,
  };
}

// biome-ignore lint/correctness/noUnusedVariables: unused for now
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
  [RulesMessage.ERROR_DRIZZLE_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(bold("Drizzle"))}`,
  ),
  [RulesMessage.ERROR_KYSELY_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(bold("Kysely"))}`,
  ),
  [RulesMessage.ERROR_DATA_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is required when using ${inverse(bold("Data fetching"))}`,
  ),
  [RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER]: error(
    `${inverse(bold("Cloudflare"))} is only compatible with ${inverse(bold("Hono"))} or ${inverse(bold("H3"))}.
Choose one of them or remove selected Server`,
  ),
  [RulesMessage.ERROR_AWS_R_COMPAT_SERVER]: error(
    `${inverse(bold("AWS"))} deployment is only compatible with ${inverse(bold("Hono"))}`,
  ),
  [RulesMessage.ERROR_SHADCN_R_REACT]: error(
    `${inverse(bold("shadcn/ui"))} is only compatible with ${inverse(bold("React"))}`,
  ),
  [RulesMessage.WARN_SHADCN_R_TAILWINDCSS]: warning(
    `${inverse(bold("shadcn/ui"))} integration is tied to ${inverse(bold("TailwindCSS"))}. Using another CSS library with it may have unpredictable behaviour.`,
  ),
  [RulesMessage.INFO_STACKBLITZ_COMPAT]: null,
} satisfies Record<RulesMessage, RuleMessage | null>;
