import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment } from "../eval.js";

export function visitorStatementWithComments(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: AST.Node | ESTree.Node | TSESTree.Node,
  meta: VikeMeta,
) {
  const comments = sourceCode.getCommentsBefore(node as ESTree.Node);

  if (comments.length > 0) {
    if (node.type === "Identifier" && (node as AST.Node).parent?.type === "CallExpression") {
      node = (node as AST.Node).parent!;
    }
    const start = node.range![0];
    let end = node.range![1];

    while (sourceCode.text[end]?.match(/\s|,/)) {
      end += 1;
    }

    const comment = comments[0];

    const condition = extractBatiConditionComment(comment);

    if (condition === null) return;

    const testVal = evalCondition(condition, meta);

    context.report({
      node: node as ESTree.Node,
      message: "bati/statement-comments",
      *fix(fixer) {
        if (!testVal) {
          yield fixer.removeRange([start, end]);
        }
        yield fixer.remove(comment as unknown as ESTree.Node);
      },
    });
  }
}
