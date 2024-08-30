import { type Rule, type SourceCode } from "eslint";
import { TSESTree } from "@typescript-eslint/utils";
import type { VikeMeta } from "../../types.js";
import { evalCondition } from "../eval.js";

export function visitorAsExpression(
  context: Rule.RuleContext,
  sourceCode: SourceCode,
  node: TSESTree.TSAsExpression,
  meta: VikeMeta,
) {
  if (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "TSQualifiedName" &&
    node.typeAnnotation.typeName.left.type === "Identifier" &&
    node.typeAnnotation.typeName.left.name === "BATI"
  ) {
    const { right } = node.typeAnnotation.typeName;
    const start = node.expression.range[1];
    const end = node.range[1];

    switch (right.name) {
      case "Any":
        context.report({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          node: node as any,
          message: "bati/as-expression-any",
          *fix(fixer) {
            yield fixer.removeRange([start, end]);
          },
        });
        break;
      case "If":
      case "IfAsUnkown":
        if (
          node.typeAnnotation.typeArguments?.type === "TSTypeParameterInstantiation" &&
          node.typeAnnotation.typeArguments.params[0].type === "TSTypeLiteral"
        ) {
          const members = node.typeAnnotation.typeArguments.params[0].members;
          context.report({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node: node as any,
            message: "bati/as-expression-if",
            *fix(fixer) {
              let fallback: string | undefined = undefined;
              let replaced = false;
              for (const member of members) {
                if (
                  member.type !== "TSPropertySignature" ||
                  member.key.type !== "Literal" ||
                  member.typeAnnotation?.type !== "TSTypeAnnotation"
                ) {
                  throw new Error("Linter: Malformed BATI.If type");
                }
                const condition = member.key.value as string;
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
                  yield fixer.replaceTextRange(
                    [start, end],
                    right.name === "IfAsUnkown" ? ` as unknown as ${value}` : ` as ${value}`,
                  );
                  replaced = true;
                  break;
                }
              }

              if (!replaced) {
                if (fallback) {
                  yield fixer.replaceTextRange(
                    [start, end],
                    right.name === "IfAsUnkown" ? ` as unknown as ${fallback}` : ` as ${fallback}`,
                  );
                } else {
                  yield fixer.removeRange([start, end]);
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
