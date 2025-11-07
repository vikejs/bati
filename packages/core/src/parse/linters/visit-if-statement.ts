import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type * as ESTree from "estree";
import type { AST } from "vue-eslint-parser";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiCondition } from "../eval.js";

function getBlockStatementRange(
  node: AST.ESLintBlockStatement | ESTree.BlockStatement | TSESTree.BlockStatement,
): [number, number] {
  if (node.body.length === 0) {
    // Empty block with just a comment
    return [node.range![0] + 1, node.range![1] - 1];
  }
  return [node.body[0].range![0], node.body[node.body.length - 1].range![1]];
}

// If the expression is as such:
//   {BATI.has("telefunc") ? <Link href="/todo">Todo</Link> : undefined}
// ensures that it writes:
//   <Link href="/todo">Todo</Link>
// instead of:
//   {<Link href="/todo">Todo</Link>}
function getJSXRangeToReplace(
  node:
    | AST.ESLintConditionalExpression
    | AST.ESLintIfStatement
    | ESTree.ConditionalExpression
    | ESTree.IfStatement
    | TSESTree.IfStatement
    | TSESTree.ConditionalExpression,
  subnode: AST.Node | ESTree.Node | TSESTree.Node,
  body: string,
) {
  return node.type === "ConditionalExpression" &&
    "parent" in node &&
    node.parent &&
    node.parent.type === "JSXExpressionContainer" &&
    (subnode.type === "JSXElement" || body === "null" || body === "undefined")
    ? {
        range: node.parent.range!,
        body: body === "null" || body === "undefined" ? "" : body,
      }
    : {
        range: node.range!,
        body,
      };
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
          const data = getJSXRangeToReplace(node, node.consequent, body);
          yield fixer.replaceTextRange(data.range, data.body);
        }
      } else if (node.alternate) {
        if (node.alternate.type === "BlockStatement") {
          const body = sourceCode.text.slice(...getBlockStatementRange(node.alternate));
          yield fixer.replaceTextRange(node.range!, body);
        } else {
          const body = sourceCode.text.slice(...node.alternate.range!);
          const data = getJSXRangeToReplace(node, node.alternate, body);
          yield fixer.replaceTextRange(data.range, data.body);
        }
      } else {
        yield fixer.remove(node as ESTree.Node);
      }
    },
  });
}
