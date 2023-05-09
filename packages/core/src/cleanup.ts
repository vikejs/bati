// @ts-ignore
import putout from "putout";

export function cleanImports(code: string, options: { filepath?: string } = {}): string {
  const printer = options.filepath?.match(/\.[jt]sx$/) ? "putout" : "recast";
  const result = putout(code, {
    isTS: true,
    printer,
    plugins: ["remove-unused-variables"],
  });

  // replace 4 spaces indent with 2 spaces indent
  // https://github.com/coderaiser/putout/issues/144
  return printer === "putout" ? result.code.replace(/(?<=^( {4})*) {4}/gm, "  ") : result.code;
}
