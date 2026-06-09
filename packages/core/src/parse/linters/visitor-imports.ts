import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type { AST } from "vue-eslint-parser";
import { relative } from "../../relative.js";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment } from "../eval.js";
import { getExtractor } from "./common.js";

export function getBatiImportMatch(subject: string) {
  return subject.match(/^@batijs\/[^/]+\/(.+)$/);
}

/**
 * Returns `true` when a BATI condition comment immediately preceding `node`
 * evaluates such that `visitorStatementWithComments` will strip the statement.
 *
 * This mirrors the removal logic in that visitor so the `include-if-imported`
 * graph stays in sync: a stripped import must not count as importing its target,
 * otherwise the target file is wrongly kept (and later flagged unused by knip).
 */
function isRemovedByCondition(
  sourceCode: SourceCode,
  node: AST.Node | ESTree.Node | TSESTree.Node,
  meta: VikeMeta,
): boolean {
  const comments = sourceCode.getCommentsBefore(node as ESTree.Node);

  if (comments.length === 0) return false;

  const condition = extractBatiConditionComment(comments[0]);

  if (condition === null) return false;

  const testVal = evalCondition(condition, meta);
  const removeCommentsOnly = comments.length > 1 && testVal === "remove-comments-only";

  return !removeCommentsOnly && (!testVal || testVal === "remove-comments-only");
}

export function visitorImportStatement(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: AST.ESLintImportDeclaration | ESTree.ImportDeclaration | TSESTree.ImportDeclaration,
  meta: VikeMeta,
) {
  const source = (node as TSESTree.ImportDeclaration).source;
  const extractor = getExtractor(context);

  // When a BATI condition will strip this import statement, it must not count
  // towards the `include-if-imported` graph (and there is no point rewriting its
  // path). Side-effect imports are never caught by the unused-imports rule, so
  // this is the only place to keep their bookkeeping correct.
  //
  // The condition may only become detectable in a later fix pass: when the
  // import is the first statement, a preceding file-level global comment (e.g.
  // `/*# BATI include-if-imported #*/`) is `comments[0]` until it is stripped,
  // hiding the `//#` condition behind it. By then `addImport` has already run in
  // an earlier pass, so retract it explicitly with `deleteImport`.
  if (isRemovedByCondition(sourceCode, node, meta)) {
    extractor?.deleteImport(source.value);
    return;
  }

  const matches = getBatiImportMatch(source.value);

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
