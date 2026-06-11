import { formatCode, mergeDts as mergeDtsCodemod, type VikeMeta } from "@batijs/core";

// Build the `.d.ts` merge transformer once (its grammar WASM loads on first use).
let merger: ReturnType<typeof mergeDtsCodemod.forTarget> | undefined;

/**
 * Merge two already-`$$`-transformed `.d.ts` files into one: concatenate them and run the `mergeDts`
 * codemod, which hoists/dedupes imports and folds same-named `declare global` / `declare module` /
 * `namespace` / `interface` declarations together. Then tidy whitespace and strip a now-empty
 * `export {}`.
 */
export async function mergeDts({
  fileContent,
  previousContent,
  filepath,
  meta,
}: {
  fileContent: string;
  previousContent: string;
  filepath: string;
  meta: VikeMeta;
}) {
  merger ??= mergeDtsCodemod.forTarget("tsx");
  const merged = (await merger).transform(`${previousContent}\n${fileContent}`, {});

  return clearExports(await formatCode(merged, { filepath }), meta);
}

const BIOME_IGNORE_EMPTY_EXPORT =
  "// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module";

export function clearExports(code: string, meta: VikeMeta) {
  if (code.trim() === "export {};") {
    return undefined;
  }
  if (meta.BATI.has("biome")) {
    const index = code.indexOf("\nexport {};");
    const foundImport = code.match(/^import .* from /gm);

    // Idempotent: a multi-file `.d.ts` merge runs this per step, and `mergeDts` preserves the comment
    // it already added, so guard against a duplicate (an unused suppression biome would flag).
    if (index !== -1 && foundImport && !code.includes(BIOME_IGNORE_EMPTY_EXPORT)) {
      return `${code.slice(0, index)}\n${BIOME_IGNORE_EMPTY_EXPORT}${code.slice(index)}`;
    }
  }
  return code;
}
