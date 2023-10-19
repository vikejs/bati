import * as tsParseForESLint from "@typescript-eslint/parser";
import { ESLint, Linter } from "eslint";
import type * as ESTree from "estree";
import * as vueParseForESLint from "vue-eslint-parser";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment } from "../eval.js";
import type { Visitors } from "./types.js";
import { visitorIfStatement } from "./visit-if-statement.js";
import { visitorStatementWithComments } from "./visitor-statement-with-comments.js";

export default function vueLinterConfig(meta: VikeMeta) {
  const plugin: ESLint.Plugin = {
    rules: {
      vue: {
        meta: { fixable: "code" },
        create(context) {
          const sourceCode = context.getSourceCode();
          const tokenStore = context.parserServices.getTemplateBodyTokenStore();
          return context.parserServices.defineTemplateBodyVisitor(
            // template
            {
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node, meta);
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
                visitorStatementWithComments(context, sourceCode, node, meta);
              },
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node, meta);
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
