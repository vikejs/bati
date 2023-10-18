import * as tsParseForESLint from "@typescript-eslint/parser";
import { ESLint, Linter, SourceCode, type Rule } from "eslint";
import type * as ESTree from "estree";
import * as vueParseForESLint from "vue-eslint-parser";
import type * as AST from "vue-eslint-parser/ast";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiCondition, extractBatiConditionComment } from "../eval.js";
import type { Visitors } from "./types.js";

export default function vueLinterConfig(meta: VikeMeta) {
  function visitorIfStatement(
    context: Rule.RuleContext,
    sourceCode: SourceCode,
    node: AST.ESLintConditionalExpression | AST.ESLintIfStatement,
  ) {
    const testString = extractBatiCondition(sourceCode, node);

    if (testString === null) return;

    const testVal = evalCondition(testString, meta);

    context.report({
      node: node as ESTree.Node,
      message: "bati/vue-if-statement",
      *fix(fixer) {
        if (testVal) {
          if (node.consequent.type === "BlockStatement") {
            const body = sourceCode.text.slice(
              node.consequent.body[0].range[0],
              node.consequent.body[node.consequent.body.length - 1].range[1],
            );
            yield fixer.replaceTextRange([node.range[0], node.range[1]], body);
          } else {
            const body = sourceCode.text.slice(node.consequent.range[0], node.consequent.range[1]);
            yield fixer.replaceTextRange([node.range[0], node.range[1]], body);
          }
        } else if (node.alternate) {
          if (node.alternate.type === "BlockStatement") {
            const body = sourceCode.text.slice(
              node.alternate.body[0].range[0],
              node.alternate.body[node.alternate.body.length - 1].range[1],
            );
            yield fixer.replaceTextRange([node.range[0], node.range[1]], body);
          } else {
            const body = sourceCode.text.slice(node.alternate.range[0], node.alternate.range[1]);
            yield fixer.replaceTextRange([node.range[0], node.range[1]], body);
          }
        } else {
          yield fixer.remove(node as ESTree.Node);
        }
      },
    });
  }

  const plugin: ESLint.Plugin = {
    rules: {
      vue: {
        meta: { fixable: "code" },
        create(context) {
          const sourceCode = context.sourceCode;
          const tokenStore = context.parserServices.getTemplateBodyTokenStore();
          return context.parserServices.defineTemplateBodyVisitor(
            // template
            {
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node);
              },
              VElement(node) {
                const elementBefore = tokenStore.getTokenBefore(node.startTag, {
                  includeComments: true,
                  filter: (token: { type: string }) => token.type !== "HTMLWhitespace",
                });

                if (elementBefore && elementBefore.type === "HTMLComment") {
                  const condition = extractBatiConditionComment(elementBefore);
                  if (condition === null) return;

                  const testVal = evalCondition(condition, meta);

                  context.report({
                    node: elementBefore,
                    message: "bati/vue-velement",
                    *fix(fixer) {
                      if (!testVal) {
                        yield fixer.remove(node as unknown as ESTree.Node);
                      }
                      yield fixer.remove(elementBefore);
                    },
                  });
                }
              },
            } satisfies Visitors,
            // script
            {
              ":statement"(node) {
                const comments = sourceCode.getCommentsBefore(node as ESTree.Node);

                if (comments.length > 0) {
                  const comment = comments[0];

                  const condition = extractBatiConditionComment(comments[0]);

                  if (condition === null) return;

                  const testVal = evalCondition(condition, meta);

                  context.report({
                    node: node as ESTree.Node,
                    message: "bati/statement-comments",
                    *fix(fixer) {
                      if (!testVal) {
                        yield fixer.remove(node as ESTree.Node);
                      }
                      yield fixer.remove(comment as unknown as ESTree.Node);
                    },
                  });
                }
              },
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node);
              },
            } satisfies Visitors,
          );
        },
      },
    },
  };

  const config: Linter.FlatConfig[] = [
    {
      plugins: {
        batiVue: plugin,
      },
      languageOptions: {
        parser: vueParseForESLint as Linter.ParserModule,
        parserOptions: {
          parser: tsParseForESLint,
          sourceType: "module",
        },
      },
      rules: {
        "batiVue/vue": "error",
      },
      files: ["**/*.vue"],
    },
  ];

  return { plugin, config };
}
