import { formatCode, markEmptyExport, mergeDts as mergeDtsCodemod, type VikeMeta } from "@batijs/core";

// Build the `.d.ts` transformers once (each grammar WASM loads on first use).
let merger: ReturnType<typeof mergeDtsCodemod.forTarget> | undefined;
let emptyExportMarker: ReturnType<typeof markEmptyExport.forTarget> | undefined;

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

export async function clearExports(code: string, meta: VikeMeta): Promise<string | undefined> {
  if (code.trim() === "export {};") {
    return undefined;
  }
  // When biome is selected, annotate a surviving `export {}` module marker so biome's
  // `noUselessEmptyExport` doesn't flag it. The codemod no-ops (and is idempotent across the per-step
  // merge) when there's nothing to mark, so it returns `code` untouched in every other case.
  if (!meta.BATI.has("biome")) return code;
  emptyExportMarker ??= markEmptyExport.forTarget("tsx");
  return (await emptyExportMarker).transform(code, {});
}
