import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type { AST } from "vue-eslint-parser";
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
    const comment = comments[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((comment as any).handled) {
      return;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (comment as any).handled = true;
    }

    const condition = extractBatiConditionComment(comment);

    if (condition === null) return;

    const testVal = evalCondition(condition, meta);

    let start: number | undefined = undefined;
    let end: number | undefined = undefined;

    const removeCommentsOnly = comments.length > 1 && testVal === "remove-comments-only";

    if (!removeCommentsOnly) {
      const identifierParents: (string | undefined)[] = ["Property"];
      const identifierElement: (string | undefined)[] = ["SpreadElement", "Identifier"];
      if (identifierElement.includes(node.type) && identifierParents.includes((node as AST.Node).parent?.type)) {
        node = (node as AST.Node).parent!;
      }
      start = node.range![0];
      end = node.range![1];

      while (sourceCode.text[end]?.match(/\s|,/)) {
        end += 1;
        if (sourceCode.text[end - 1] === ",") {
          break;
        }
      }
    }

    context.report({
      node: node as ESTree.Node,
      message: "bati/statement-comments",
      *fix(fixer) {
        if (!testVal || testVal === "remove-comments-only") {
          if (start !== undefined && end !== undefined) {
            yield fixer.removeRange([start, end]);
          }
          for (const c of comments) {
            yield fixer.remove(c as unknown as ESTree.Node);
          }
        } else {
          yield fixer.remove(comment as unknown as ESTree.Node);
        }
      },
    });
  }
}
