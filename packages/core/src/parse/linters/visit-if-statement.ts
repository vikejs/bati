import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiCondition } from "../eval.js";

function getBlockStatementRange(
  node: AST.ESLintBlockStatement | ESTree.BlockStatement | TSESTree.BlockStatement,
): [number, number] {
  return [node.body[0].range![0], node.body[node.body.length - 1].range![1]];
}

export function visitorIfStatement(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node:
    | AST.ESLintConditionalExpression
    | AST.ESLintIfStatement
    | ESTree.ConditionalExpression
    | ESTree.IfStatement
    | TSESTree.IfStatement
    | TSESTree.ConditionalExpression,
  meta: VikeMeta,
) {
  const testString = extractBatiCondition(sourceCode, node);

  if (testString === null) return;

  const testVal = evalCondition(testString, meta);

  context.report({
    node: node as ESTree.Node,
    message: "bati/if-statement",
    *fix(fixer) {
      if (testVal) {
        if (node.consequent.type === "BlockStatement") {
          const body = sourceCode.text.slice(...getBlockStatementRange(node.consequent));
          yield fixer.replaceTextRange(node.range!, body);
        } else {
          const body = sourceCode.text.slice(...node.consequent.range!);
          yield fixer.replaceTextRange(node.range!, body);
        }
      } else if (node.alternate) {
        if (node.alternate.type === "BlockStatement") {
          const body = sourceCode.text.slice(...getBlockStatementRange(node.alternate));
          yield fixer.replaceTextRange(node.range!, body);
        } else {
          const body = sourceCode.text.slice(...node.alternate.range!);
          yield fixer.replaceTextRange(node.range!, body);
        }
      } else {
        yield fixer.remove(node as ESTree.Node);
      }
    },
  });
}
