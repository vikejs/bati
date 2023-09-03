import { traverse } from "estree-toolkit";
import type { ASTNode } from "magicast";

export function cleanImports(ast: ASTNode): ASTNode {
  traverse(ast, {
    $: { scope: true },
    Program(path) {
      const bindings = path.scope?.bindings;
      if (!bindings) return;

      for (const b of Object.values(bindings)) {
        // TODO: needs typescript support to be useful
        // https://github.com/sarsamurmu/estree-toolkit/issues/12
        if (b && b.kind === "module" && b.references.length === 0) {
          if (Array.isArray(b.path.container) && b.path.container.length > 1) {
            b.path.remove();
          } else {
            b.path.parentPath?.remove();
          }
        }
      }
      path.scope?.crawl();
    },
  });

  return ast;
}
