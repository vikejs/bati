import * as tsParseForESLint from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { ESLint, Linter } from "eslint";
import type * as ESTree from "estree";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment } from "../eval.js";
import type { Visitors } from "./types.js";
import { visitorIfStatement } from "./visit-if-statement.js";
import { visitorStatementWithComments } from "./visitor-statement-with-comments.js";

export default function vueLinterConfig(meta: VikeMeta) {
  const plugin: ESLint.Plugin = {
    rules: {
      ts: {
        meta: { fixable: "code" },
        // @ts-ignore
        create(context) {
          const sourceCode = context.getSourceCode();
          return {
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
              visitorIfStatement(context, sourceCode, node, meta);
            },
            IfStatement(node) {
              visitorIfStatement(context, sourceCode, node, meta);
            },
            JSXAttribute(node) {
              visitorStatementWithComments(context, sourceCode, node, meta);
            },
          } satisfies Visitors<TSESTree.Node>;
        },
      },
    },
  };

  const config: Linter.FlatConfig[] = [
    {
      plugins: {
        batiTs: plugin,
      },
      languageOptions: {
        parser: tsParseForESLint as Linter.ParserModule,
      },
      rules: {
        "batiTs/ts": "error",
      },
      files: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
    },
  ];

  return { plugin, config };
}
