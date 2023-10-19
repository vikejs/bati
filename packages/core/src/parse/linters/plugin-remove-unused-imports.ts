// Adapted from https://github.com/sweepline/eslint-plugin-unused-imports

import tslint from "@typescript-eslint/eslint-plugin";
import type { ESLint, Linter } from "eslint";
// @ts-ignore
import ruleComposer from "eslint-rule-composer";

const commaFilter = { filter: (token: { value: string }) => token.value === "," };
const includeCommentsFilter = { includeComments: true };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unusedImportsPredicate(problem: any, context: any) {
  const { sourceCode } = context;

  const { node } = problem;
  const { parent } = node;

  // If parent is null just let the composed rule handle it
  if (parent == null) {
    return problem;
  }

  // Only handle these 3 cases.
  switch (parent.type) {
    case "ImportSpecifier":
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
      break;
    default:
      return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problem.fix = (fixer: any) => {
    if (!parent) {
      return null;
    }
    const grandParent = parent.parent;

    if (!grandParent) {
      return null;
    }

    // Only one import
    if (grandParent.specifiers.length === 1) {
      const nextToken = sourceCode.getTokenAfter(grandParent, includeCommentsFilter);
      const newLinesBetween = nextToken ? nextToken.loc.start.line - grandParent.loc.start.line : 0;
      const endOfReplaceRange = nextToken ? nextToken.range[0] : grandParent.range[1];
      const count = Math.max(0, newLinesBetween - 1);

      return [
        fixer.remove(grandParent),
        fixer.replaceTextRange([grandParent.range[1], endOfReplaceRange], "\n".repeat(count)),
      ];
    }

    // Not last specifier
    if (parent !== grandParent.specifiers[grandParent.specifiers.length - 1]) {
      const comma = sourceCode.getTokenAfter(parent, commaFilter);
      const prevNode = sourceCode.getTokenBefore(parent);

      return [fixer.removeRange([prevNode.range[1], parent.range[0]]), fixer.remove(parent), fixer.remove(comma)];
    }

    // Default export and a single normal left, ex. "import default, { package1 } from 'module';"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (grandParent.specifiers.filter((specifier: any) => specifier.type === "ImportSpecifier").length === 1) {
      const start = sourceCode.getTokenBefore(parent, commaFilter);
      const end = sourceCode.getTokenAfter(parent, { filter: (token: { value: string }) => token.value === "}" });

      return fixer.removeRange([start.range[0], end.range[1]]);
    }

    return fixer.removeRange([sourceCode.getTokenBefore(parent, commaFilter).range[0], parent.range[1]]);
  };
  return problem;
}

export default function pluginRemoveUnusedImports() {
  const rule = tslint.rules["no-unused-vars"];
  rule.meta.fixable = "code";

  const plugin: ESLint.Plugin = {
    rules: {
      ["unused-imports"]: ruleComposer.filterReports(rule, unusedImportsPredicate),
    },
  };

  const config: Linter.FlatConfig[] = [
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
