import * as tsParseForESLint from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { ESLint, Linter } from "eslint";
import solid from "eslint-plugin-solid/configs/recommended";
import type { VikeMeta } from "../../types.js";
import type { Visitors } from "./types.js";
import { visitorIfStatement } from "./visit-if-statement.js";
import { visitorGlobalComments } from "./visitor-global-comments.js";
import { visitorImportStatement } from "./visitor-imports.js";
import { visitorStatementWithComments } from "./visitor-statement-with-comments.js";
import { visitorAsExpression, visitorTypeParameterInstanciation, visitorTypeReference } from "./visitor-ts-types.js";

export default function tsLinterConfig(meta: VikeMeta) {
  const plugin: ESLint.Plugin = {
    rules: {
      ts: {
        meta: { fixable: "code" },
        // @ts-ignore
        create(context) {
          const sourceCode = context.sourceCode;

          return {
            Program(node) {
              visitorGlobalComments(context, sourceCode, node);
            },
            ImportDeclaration(node) {
              visitorImportStatement(context, node);
            },
            ":expression"(node) {
              visitorStatementWithComments(context, sourceCode, node, meta);
            },
            ":statement"(node) {
              visitorStatementWithComments(context, sourceCode, node, meta);
            },
            SpreadElement(node) {
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
            TSAsExpression(node) {
              visitorAsExpression(context, sourceCode, node, meta);
            },
            TSTypeParameterInstantiation(node) {
              visitorTypeParameterInstanciation(context, sourceCode, node, meta);
            },
            TSTypeReference(node) {
              visitorTypeReference(context, sourceCode, node, meta);
            },
          } satisfies Visitors<TSESTree.Node>;
        },
      },
    },
  };

  const config: Linter.Config[] = [
    {
      plugins: {
        batiTs: plugin,
      },
      languageOptions: {
        parser: tsParseForESLint,
        parserOptions: {
          warnOnUnsupportedTypeScriptVersion: false,
        },
      },
      rules: {
        "batiTs/ts": "error",
      },
      files: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
    },
  ];

  if (meta.BATI.has("solid")) {
    // @ts-ignore
    config.push({
      files: ["**/*.{ts,tsx}"],
      ...solid,
      languageOptions: {
        parser: tsParseForESLint,
      },
    });
  }

  return { plugin, config };
}
