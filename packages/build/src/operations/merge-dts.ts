import { mergeDts as mergeDtsCodemod, tidyWhitespace, type VikeMeta } from "@batijs/core";

// Build the `.d.ts` merge transformer once (its grammar WASM loads on first use).
let merger: ReturnType<typeof mergeDtsCodemod.forTarget> | undefined;

/**
 * Merge two already-`$$`-transformed `.d.ts` files into one: concatenate them and run the `mergeDts`
 * codemod, which hoists/dedupes imports and folds same-named `declare global` / `declare module` /
 * `namespace` / `interface` declarations together (the codegraft replacement for the old magicast
 * AST splice). Then tidy whitespace and strip a now-empty `export {}`.
 */
export async function mergeDts({
  fileContent,
  previousContent,
  meta,
}: {
  fileContent: string;
  previousContent: string;
  meta: VikeMeta;
}) {
  merger ??= mergeDtsCodemod.forTarget("tsx");
  const merged = (await merger).transform(`${previousContent}\n${fileContent}`, {});

  return clearExports(tidyWhitespace(merged), meta);
}

export function clearExports(code: string, meta: VikeMeta) {
  if (code.trim() === "export {};") {
    return undefined;
  }
  if (meta.BATI.has("biome")) {
    const index = code.indexOf("\nexport {};");
    const foundImport = code.match(/^import .* from /gm);

    if (index !== -1 && foundImport) {
      return (
        code.slice(0, index) +
        "\n// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module" +
        code.slice(index)
      );
    }
  }
  return code;
}
