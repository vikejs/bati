import { defineCodemod } from "@codegraft/codemod";
import type { GrammarId } from "@codegraft/core";
import { relative } from "../relative.js";
import type { BatiContext } from "./context.js";

/**
 * Bati's import-graph pass: rewrite `@batijs/<pkg>/<rest>` specifiers to a relative path (from
 * `ctx.filename`) and record every surviving relative import into `ctx.imports`.
 *
 * Not `$$`-scan-gated: a file may import from `@batijs/…` with no `$$` directive. Run it after
 * `batiCodemod`, so an import a false condition removed is already gone. Without `ctx.filename` the
 * path is unknown, so `@batijs/…` rewriting is skipped.
 */
export const batiImports = defineCodemod<BatiContext>((root, ctx) => {
  root.find("import_statement").forEach((statement) => {
    const fragment = statement.field("source").children().first(); // the unquoted specifier text
    if (fragment.size() === 0) return; // a bare `import x`, or an empty specifier
    const specifier = fragment.text;
    const batijs = specifier.match(/^@batijs\/[^/]+\/(.+)$/);
    if (batijs) {
      if (ctx.filename === undefined) return;
      const relativePath = relative(ctx.filename, batijs[1]);
      fragment.replaceWith(relativePath);
      ctx.imports?.add(relativePath);
    } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
      ctx.imports?.add(specifier);
    }
  });
});

export const targets: GrammarId[] = ["javascript", "typescript", "tsx"];
