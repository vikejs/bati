import { format } from "prettier/standalone";
import * as prettierPluginBabel from "prettier/plugins/babel";
// @ts-ignore
import * as prettierPluginEstree from "prettier/plugins/estree";

export function formatCode(code: string): Promise<string> {
  return format(code, { parser: "babel-ts", plugins: [prettierPluginBabel, prettierPluginEstree] });
}
