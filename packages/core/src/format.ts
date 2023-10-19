// /!\ putout packaging is ... old-school, so be sure to directly import all that we need

import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import { format } from "prettier/standalone";

export function formatCode(code: string, options: { filepath: string }): Promise<string> {
  return format(code, {
    parser: "babel-ts",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [prettierPluginBabel, prettierPluginEstree as any],
    filepath: options.filepath,
  });
}
