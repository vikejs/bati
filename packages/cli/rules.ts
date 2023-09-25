import { RulesMessage } from "@batijs/core/rules";
import { bold, inverse } from "colorette";

export interface ConflictMessage {
  type: "warning" | "error" | "info";
  value: string;
}

function error(value: string): ConflictMessage {
  return {
    type: "error",
    value,
  };
}

export const conflictMessages = {
  [RulesMessage.ERROR_AUTH_R_SERVER]: error(
    `A ${inverse(bold("Server"))} is mandatory when using ${inverse(
      bold("Auth"),
    )}. Check https://vite-plugin-ssr.com/integration#server-side-tools for details and https://batijs.github.io for available servers`,
  ),
} satisfies Record<RulesMessage, ConflictMessage>;
