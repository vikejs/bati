import * as prettierPluginEstree from "prettier/plugins/estree";
import * as prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginTs from "prettier/plugins/typescript";
import { format } from "prettier/standalone";

export function formatCode(code: string, options: { filepath: string }): Promise<string> {
  return format(code, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [prettierPluginTs, prettierPluginEstree as any, prettierPluginHtml],
    filepath: options.filepath,
    vueIndentScriptAndStyle: true,
  });
}
