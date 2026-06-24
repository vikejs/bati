import type { Transformer } from "@codegraft/core";
import { batiExtract, type ExtractContext } from "../codemods/index.js";
import { extToTarget } from "./codemods.js";

// One transformer per target (grammar WASM loads once) — the graph build runs this over every
// boilerplate file.
const transformers = new Map<string, Promise<Transformer<ExtractContext>>>();

/** The raw feature-referencing expressions in `code` (see {@link batiExtract}). A verbatim-copy file
 *  (`.env`, `.json`, `.md`, Dockerfile) carries no conditions and yields the empty set. */
export async function extractReferences(code: string, filepath: string): Promise<Set<string>> {
  const target = extToTarget(filepath);
  if (target === null) return new Set();

  const key = typeof target === "string" ? target : "vue";
  let transformer = transformers.get(key);
  if (!transformer) {
    transformer = batiExtract.forTarget(target);
    transformers.set(key, transformer);
  }

  const refs = new Set<string>();
  (await transformer).transform(code, { refs });
  return refs;
}
