// @ts-ignore
import putout from "putout";

export function cleanImports(code: string, options: { filepath?: string } = {}): string {
  const isJSX = options.filepath?.match(/\.[jt]sx$/);
  const printer = isJSX
    ? [
        "putout",
        {
          format: {
            indent: "  ",
          },
        },
      ]
    : "recast";
  const result = putout(code, {
    isJSX,
    isTS: true,
    printer,
    plugins: ["remove-unused-variables"],
  });

  return result.code;
}
