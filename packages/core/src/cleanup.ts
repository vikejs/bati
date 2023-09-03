// /!\ putout packaging is ... old-school, so be sure to directly import all that we need
// @ts-ignore
import putout from "putout";
// @ts-ignore
import removeUnusedVariables from "@putout/plugin-remove-unused-variables";

export function cleanImports(code: string, options: { filepath?: string } = {}): Promise<string> {
  const isJSX = Boolean(options.filepath?.match(/\.[jt]sx$/));
  const result = putout(code, {
    isJSX,
    isTS: true,
    printer: "recast",
    plugins: [["remove-unused-variables", removeUnusedVariables]],
  });

  return result.code;
}
