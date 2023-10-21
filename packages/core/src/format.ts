import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import * as prettierPluginHtml from "prettier/plugins/html";
import { format } from "prettier/standalone";

export function formatCode(code: string, options: { filepath: string }): Promise<string> {
  const parser =
    options.filepath.endsWith(".ts") || options.filepath.endsWith(".tsx")
      ? {
          // ligther than typescript parser
          parser: "babel-ts",
        }
      : {};
  return format(code, {
    ...parser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [prettierPluginBabel, prettierPluginEstree as any, prettierPluginHtml],
    filepath: options.filepath,
    vueIndentScriptAndStyle: true,
  });
}
