import * as tsParseForESLint from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { ESLint, Linter } from "eslint";
// @ts-ignore
import solid from "eslint-plugin-solid/configs/recommended";
import type { VikeMeta } from "../../types.js";
import type { Visitors } from "./types.js";
import { visitorIfStatement } from "./visit-if-statement.js";
import { visitorImportStatement } from "./visitor-imports.js";
import { visitorStatementWithComments } from "./visitor-statement-with-comments.js";

export default function tsLinterConfig(meta: VikeMeta) {
  const plugin: ESLint.Plugin = {
    rules: {
      ts: {
        meta: { fixable: "code" },
        // @ts-ignore
        create(context) {
          const sourceCode = context.sourceCode;
          return {
            ImportDeclaration(node) {
              visitorImportStatement(context, node);
            },
            ":expression"(node) {
              visitorStatementWithComments(context, sourceCode, node, meta);
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

  if (meta.BATI.has("solid")) {
    config.push({
      files: ["**/*.{ts,tsx}"],
      ...solid,
      languageOptions: {
        parser: tsParseForESLint as Linter.ParserModule,
      },
    });
  }

  return { plugin, config };
}
