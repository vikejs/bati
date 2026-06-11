import path from "node:path";
import { defineCodemod } from "@codegraft/codemod";
import type { GrammarId } from "@codegraft/core";
import type { BatiContext } from "./context.js";

/**
 * Bati's import-graph pass: rewrite `@batijs/<pkg>/<rest>` specifiers to a relative path (from
 * `ctx.filename`) and record every surviving relative import into `ctx.imports`.
 *
 * Not `$$`-scan-gated: a file may import from `@batijs/…` with no `$$` directive. Run it after
 * `batiCodemod`, so an import a false condition removed is already gone (mirroring Bati's
 * `deleteImport`). Without `ctx.filename` the path is unknown, so `@batijs/…` rewriting is skipped.
 */
export const batiImports = defineCodemod<BatiContext>((root, ctx) => {
  root.find("import_statement").forEach((statement) => {
    const fragment = statement.field("source").children().first(); // the unquoted specifier text
    if (fragment.size() === 0) return; // a bare `import x`, or an empty specifier
    const specifier = fragment.text;
    const batijs = specifier.match(/^@batijs\/[^/]+\/(.+)$/);
    if (batijs) {
      if (ctx.filename === undefined) return;
      const relativePath = relativeImport(ctx.filename, batijs[1]);
      fragment.replaceWith(relativePath);
      ctx.imports?.add(relativePath);
    } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
      ctx.imports?.add(specifier);
    }
  });
});

export default batiImports;

export const targets: GrammarId[] = ["javascript", "typescript", "tsx"];

/** A relative module specifier from `fromFile` to `target` (Bati's `relative`, inlined). */
function relativeImport(fromFile: string, target: string): string {
  const from = fromFile.replace(/[\\/]+/g, "/");
  const relative = path.posix.relative(path.posix.dirname(from), target.replace(/[\\/]+/g, "/"));
  return relative.startsWith("../") ? relative : `./${relative}`;
}
