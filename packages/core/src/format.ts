import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import * as prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginCss from "prettier/plugins/postcss";
import * as prettierPluginTs from "prettier/plugins/typescript";
import { format } from "prettier/standalone";

export function formatCode(code: string, options: { filepath: string }): Promise<string> {
  return format(code, {
    plugins: [
      prettierPluginBabel,
      prettierPluginTs,
      // biome-ignore lint/suspicious/noExplicitAny: type mismatch
      prettierPluginEstree as any,
      prettierPluginHtml,
      prettierPluginCss,
    ],
    filepath: options.filepath,
    printWidth: 120,
  });
}
