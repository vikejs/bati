import { bold, inverse } from "colorette";
import { RulesMessage } from "@batijs/core/conflicts";

export const conflictMessages = {
  [RulesMessage.AUTH_R_SERVER]: `A ${inverse(bold("Server"))} is mandatory when using ${inverse(
    bold("Auth"),
  )}. Check https://vite-plugin-ssr.com/integration#server-side-tools for details and https://batijs.github.io for available servers`,
};
