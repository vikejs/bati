import * as tsParseForESLint from "@typescript-eslint/parser";
import { ESLint, Linter } from "eslint";
import type * as ESTree from "estree";
import * as vueParseForESLint from "vue-eslint-parser";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment } from "../eval.js";
import type { Visitors } from "./types.js";
import { visitorIfStatement } from "./visit-if-statement.js";
import { visitorImportStatement } from "./visitor-imports.js";
import { visitorStatementWithComments } from "./visitor-statement-with-comments.js";
import { visitorAsExpression } from "./visitor-ts-types.js";

function getAllCommentsBefore(
  nodeOrToken: vueParseForESLint.AST.VElement | vueParseForESLint.AST.Token,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenStore: any,
): vueParseForESLint.AST.Token[] {
  const elementBefore = tokenStore.getTokenBefore("startTag" in nodeOrToken ? nodeOrToken.startTag : nodeOrToken, {
    includeComments: true,
    filter: (token: { type: string }) => token.type !== "HTMLWhitespace",
  });

  if (elementBefore && elementBefore.type === "HTMLComment") {
    return [...getAllCommentsBefore(elementBefore, tokenStore), elementBefore];
  }
  return [];
}

export default function vueLinterConfig(meta: VikeMeta) {
  const plugin: ESLint.Plugin = {
    rules: {
      vue: {
        meta: { fixable: "code" },
        create(context) {
          const sourceCode = context.sourceCode;
          const tokenStore = sourceCode.parserServices.getTemplateBodyTokenStore();
          return sourceCode.parserServices.defineTemplateBodyVisitor(
            // template
            {
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              VElement(node) {
                const commentsBefore = getAllCommentsBefore(node, tokenStore);

                if (commentsBefore.length > 0) {
                  const condition = extractBatiConditionComment(commentsBefore[0]);

                  if (condition === null) return;

                  const testVal = evalCondition(condition, meta);

                  context.report({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: node as any,
                    message: "bati/vue-velement",
                    *fix(fixer) {
                      if (!testVal) {
                        yield fixer.remove(node as unknown as ESTree.Node);
                        yield fixer.removeRange([
                          commentsBefore[0].range[0],
                          commentsBefore[commentsBefore.length - 1].range[1],
                        ]);
                      } else {
                        yield fixer.removeRange([commentsBefore[0].range[0], commentsBefore[0].range[1]]);
                      }
                    },
                  });
                }
              },
            } satisfies Visitors,
            // script
            {
              ImportDeclaration(node) {
                visitorImportStatement(context, node);
              },
              ":statement"(node) {
                visitorStatementWithComments(context, sourceCode, node, meta);
              },
              ConditionalExpression(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              IfStatement(node) {
                visitorIfStatement(context, sourceCode, node, meta);
              },
              TSAsExpression(node) {
                visitorAsExpression(context, sourceCode, node, meta);
              },
            } satisfies Visitors,
          );
        },
      },
    },
  };

  const config: Linter.Config[] = [
    {
      plugins: {
        batiVue: plugin,
      },
      languageOptions: {
        parser: vueParseForESLint,
        parserOptions: {
          parser: tsParseForESLint,
          ecmaVersion: 2022,
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
