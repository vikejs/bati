import { defineCodemod } from "@codegraft/codemod";
import type { GrammarId } from "@codegraft/core";

/** The biome suppression Bati puts above a merged `.d.ts`'s bare `export {}` module marker. */
export const BIOME_IGNORE_EMPTY_EXPORT =
  "// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module";

/**
 * Tag a `.d.ts`'s bare `export {}` — the marker that keeps a declaration-only file a module — with a
 * biome_ignore so biome's `noUselessEmptyExport` rule doesn't flag it. The AST-aware replacement for
 * Bati's old `indexOf`/`slice` injection: it edits the real `export {}` statement, never a string
 * that happens to read `export {};`.
 *
 * Only when the file has imports — without them the empty export is genuinely useless and Bati drops
 * the file (the caller handles that case). Idempotent: the per-step `.d.ts` merge re-runs this, so an
 * `export {}` already carrying the suppression is left alone.
 */
export const markEmptyExport = defineCodemod((root) => {
  if (root.find("import_statement").size() === 0) return;
  root.find("export_clause").forEach((clause) => {
    if (clause.find("export_specifier").size() > 0) return; // `export { x }`, not the bare marker
    const stmt = clause.parent(); // the `export_statement`
    if (stmt.node.leadingComments.some((c) => c.text.includes("noUselessEmptyExport"))) return;
    stmt.addLeadingComment(BIOME_IGNORE_EMPTY_EXPORT);
  });
});

// `tsx` is a superset of TypeScript, so one grammar covers `.d.ts` too — matching the rest of the pipeline.
export const targets: GrammarId[] = ["tsx"];
