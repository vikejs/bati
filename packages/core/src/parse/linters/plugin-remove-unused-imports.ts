/** biome-ignore-all lint/suspicious/noExplicitAny: port */
// Adapted from https://github.com/sweepline/eslint-plugin-unused-imports

import tslint from "@typescript-eslint/eslint-plugin";
import type { ESLint, Linter } from "eslint";
// @ts-expect-error
import ruleComposer from "eslint-rule-composer";
import { getExtractor } from "./common.js";

const makePredicate = (isImport: boolean, addFixer: any) => (problem: any, context: any) => {
  const { parent } =
    problem.node ??
    // typescript-eslint >= 7.8 sets a range instead of a node
    context.sourceCode.getNodeByRangeIndex(context.sourceCode.getIndexFromLoc(problem.loc.start));
  return parent
    ? /^Import(|Default|Namespace)Specifier$/.test(parent.type) === isImport &&
        Object.assign(problem, addFixer?.(parent, context))
    : problem; // If parent is null just let the composed rule handle it
};

const commaFilter = { filter: (token: any) => token.value === "," };
const includeCommentsFilter = { includeComments: true };

const unusedImportsPredicate = makePredicate(true, (parent: any, context: any) => ({
  fix(fixer: any) {
    const grandParent = parent.parent;

    if (!grandParent) {
      return null;
    }

    const extractor = getExtractor(context);

    // Only one import
    if (grandParent.specifiers.length === 1) {
      const nextToken = context.sourceCode.getTokenAfter(grandParent, includeCommentsFilter);
      const newLinesBetween = nextToken ? nextToken.loc.start.line - grandParent.loc.start.line : 0;
      const endOfReplaceRange = nextToken ? nextToken.range[0] : grandParent.range[1];
      const count = Math.max(0, newLinesBetween - 1);

      extractor?.deleteImport(grandParent.source.value);

      return [
        fixer.remove(grandParent),
        fixer.replaceTextRange([grandParent.range[1], endOfReplaceRange], "\n".repeat(count)),
      ];
    }

    // Not last specifier
    if (parent !== grandParent.specifiers[grandParent.specifiers.length - 1]) {
      const comma = context.sourceCode.getTokenAfter(parent, commaFilter);
      const prevNode = context.sourceCode.getTokenBefore(parent);

      return [fixer.removeRange([prevNode.range[1], parent.range[0]]), fixer.remove(parent), fixer.remove(comma)];
    }

    // Default export and a single normal left, ex. "import default, { package1 } from 'module';"
    if (grandParent.specifiers.filter((specifier: any) => specifier.type === "ImportSpecifier").length === 1) {
      const start = context.sourceCode.getTokenBefore(parent, commaFilter);
      const end = context.sourceCode.getTokenAfter(parent, {
        filter: (token: any) => token.value === "}",
      });

      return fixer.removeRange([start.range[0], end.range[1]]);
    }

    return fixer.removeRange([context.sourceCode.getTokenBefore(parent, commaFilter).range[0], parent.range[1]]);
  },
}));

export default function pluginRemoveUnusedImports(): {
  plugin: ESLint.Plugin;
  config: Linter.Config[];
} {
  const rule = tslint.rules["no-unused-vars"];
  rule.meta.fixable = "code";

  const plugin: ESLint.Plugin = {
    rules: {
      "unused-imports": ruleComposer.filterReports(rule, unusedImportsPredicate),
    },
  };

  const config: Linter.Config[] = [
    {
      plugins: {
        "unused-imports": plugin,
      },
      rules: {
        "unused-imports/unused-imports": "error",
      },
    },
  ];

  return { plugin, config };
}
