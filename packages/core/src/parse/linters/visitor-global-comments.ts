import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type { AST } from "vue-eslint-parser";
import { extractBatiGlobalComment } from "../eval.js";
import { getExtractor } from "./common.js";

export function visitorGlobalComments(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: AST.Node | ESTree.Node | TSESTree.Node,
) {
  const comments = sourceCode.getAllComments();

  if (comments.length > 0 && comments[0].range?.[0] === 0) {
    const comment = comments[0];

    const flags = extractBatiGlobalComment(comment);

    if (flags === null || flags.length === 0) return;

    const extractor = getExtractor(context);

    for (const flag of flags) {
      switch (flag) {
        case "include-if-imported":
          extractor?.addFlag(flag);
          break;
        default:
          context.report({
            node: node as ESTree.Node,
            message: `Unknown BATI file flag ${flag}`,
            loc: comment.loc!,
          });
          return;
      }
    }

    context.report({
      node: node as ESTree.Node,
      message: "bati/global-comment",
      *fix(fixer) {
        yield fixer.remove(comment as unknown as ESTree.Node);
      },
    });
  }
}
