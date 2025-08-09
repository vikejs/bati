import type { TSESTree } from "@typescript-eslint/utils";
import type { Rule, SourceCode } from "eslint";
import type { VikeMeta } from "../../types.js";
import { evalCondition } from "../eval.js";

export function visitorAsExpression(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: TSESTree.TSAsExpression,
  meta: VikeMeta,
) {
  transformBatiType(
    context,
    sourceCode,
    node.typeAnnotation,
    meta,
    () => {
      const start = node.expression.range[1] + 1;
      const end = node.range[1];

      return [start, end];
    },
    (value, right) => {
      return right.name === "IfAsUnknown" ? ` as unknown as ${value}` : ` as ${value}`;
    },
  );
}

export function visitorTypeParameterInstanciation(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: TSESTree.TSTypeParameterInstantiation,
  meta: VikeMeta,
) {
  for (const param of node.params) {
    transformBatiType(
      context,
      sourceCode,
      param,
      meta,
      () => {
        return [node.params[0].range[0], node.params[node.params.length - 1].range[1]];
      },
      (value) => {
        return value;
      },
    );
  }
}

export function visitorTypeReference(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: TSESTree.TSTypeReference,
  meta: VikeMeta,
) {
  transformBatiType(
    context,
    sourceCode,
    node,
    meta,
    () => {
      return node.range;
    },
    (value) => {
      return value;
    },
  );
}

export function transformBatiType(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: TSESTree.Node,
  meta: VikeMeta,
  getRange: () => [start: number, end: number],
  replaceBy: (value: string, right: TSESTree.Identifier) => string,
) {
  if (
    node.type === "TSTypeReference" &&
    node.typeName.type === "TSQualifiedName" &&
    node.typeName.left.type === "Identifier" &&
    node.typeName.left.name === "BATI"
  ) {
    const { right } = node.typeName;
    const range = getRange();

    switch (right.name) {
      case "Any":
        context.report({
          // biome-ignore lint/suspicious/noExplicitAny: type mismatch
          node: node as any,
          message: "bati/as-expression-any",
          *fix(fixer) {
            yield fixer.removeRange(range);
          },
        });
        break;
      case "If":
      case "IfAsUnknown":
        if (
          node.typeArguments?.type === "TSTypeParameterInstantiation" &&
          node.typeArguments.params[0].type === "TSTypeLiteral"
        ) {
          const members = node.typeArguments.params[0].members;
          context.report({
            // biome-ignore lint/suspicious/noExplicitAny: type mismatch
            node: node as any,
            message: "bati/as-expression-if",
            *fix(fixer) {
              let fallback: string | undefined;
              let replaced = false;
              for (const member of members) {
                if (
                  member.type !== "TSPropertySignature" ||
                  (member.key.type !== "Literal" && member.key.type !== "Identifier") ||
                  member.typeAnnotation?.type !== "TSTypeAnnotation"
                ) {
                  console.log();
                  throw new Error("Linter: Malformed BATI.If members type");
                }
                const condition = ("value" in member.key ? member.key.value : member.key.name) as string;
                const value = sourceCode.text.slice(
                  member.typeAnnotation.typeAnnotation.range[0],
                  member.typeAnnotation.typeAnnotation.range[1],
                );

                if (condition === "_") {
                  fallback = value;
                  continue;
                }

                const testVal = evalCondition(condition, meta);

                if (testVal) {
                  yield fixer.replaceTextRange(range, replaceBy(value, right));
                  replaced = true;
                  break;
                }
              }

              if (!replaced) {
                if (fallback) {
                  yield fixer.replaceTextRange(range, replaceBy(fallback, right));
                } else {
                  yield fixer.removeRange(range);
                }
              }
            },
          });
        } else {
          throw new Error("Linter: Malformed BATI.If type");
        }
        break;
      default:
        throw new Error(`Linter: Unhandled BATI.${right.name} type`);
    }
  }
}
