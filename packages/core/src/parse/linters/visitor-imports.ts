import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule } from "eslint";
import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";
import { relative } from "../../relative.js";
import { getExtractor } from "./common.js";

export function getBatiImportMatch(subject: string) {
  return subject.match(/^@batijs\/[^/]+\/(.+)$/);
}

export function visitorImportStatement(
  context: Rule.RuleContext,
  node: AST.ESLintImportDeclaration | ESTree.ImportDeclaration | TSESTree.ImportDeclaration,
) {
  const matches = getBatiImportMatch((node as TSESTree.ImportDeclaration).source.value);
  const extractor = getExtractor(context);

  if (matches) {
    const newImport = relative(context.filename, matches[1]);
    extractor?.addImport(newImport);
    context.report({
      node: node as ESTree.Node,
      message: "bati/module-imports",
      *fix(fixer) {
        yield fixer.replaceTextRange(
          [
            (node as TSESTree.ImportDeclaration).source.range[0] + 1,
            (node as TSESTree.ImportDeclaration).source.range[1] - 1,
          ],
          newImport,
        );
      },
    });
  } else if (
    (node as TSESTree.ImportDeclaration).source.value.startsWith("./") ||
    (node as TSESTree.ImportDeclaration).source.value.startsWith("../")
  ) {
    extractor?.addImport((node as TSESTree.ImportDeclaration).source.value);
  }
}
