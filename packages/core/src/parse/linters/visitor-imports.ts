import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule } from "eslint";
import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";
import { relative } from "../../relative.js";

export function visitorImportStatement(
  context: Rule.RuleContext,
  node: AST.ESLintImportDeclaration | ESTree.ImportDeclaration | TSESTree.ImportDeclaration,
) {
  const matches = (node as TSESTree.ImportDeclaration).source.value.match(/^@batijs\/[^/]+\/(.+)$/);

  if (matches) {
    context.report({
      node: node as ESTree.Node,
      message: "bati/module-imports",
      *fix(fixer) {
        yield fixer.replaceTextRange(
          [
            (node as TSESTree.ImportDeclaration).source.range[0] + 1,
            (node as TSESTree.ImportDeclaration).source.range[1] - 1,
          ],
          relative(context.filename, matches[1]),
        );
      },
    });
  } else if ((node as TSESTree.ImportDeclaration).source.value.startsWith("bati:")) {
    context.report({
      node: node as ESTree.Node,
      message: "bati/module-imports-generic",
      *fix(fixer) {
        yield fixer.removeRange([
          (node as TSESTree.ImportDeclaration).source.range[0] + 1,
          (node as TSESTree.ImportDeclaration).source.range[0] + "bati:".length + 1,
        ]);
      },
    });
  }
}
