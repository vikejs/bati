// The role of this file is to describe rules for packages which may conflict with one another
import type { CategoryLabels } from "../categories.js";
import { features, flags, type Flags } from "../features.js";
import type { RulesMessage } from "./enum.js";

export type FeatureOrCategory = Flags | CategoryLabels;
export type Rule = (fts: Set<FeatureOrCategory>) => null | undefined | false | RulesMessage;

/**
 * Returns a message if all given rules are not exclusive
 */
export function exclusive(message: RulesMessage, rules: FeatureOrCategory[]): Rule {
  return (fts: Set<FeatureOrCategory>) => rules.every((r) => fts.has(r)) && message;
}

/**
 * Returns a message if subject is present but rules are not
 */
export function requires(
  message: RulesMessage,
  ifPresent: FeatureOrCategory,
  mustAlsoInclude: FeatureOrCategory[],
): Rule {
  const m = Array.from(prepare(mustAlsoInclude));
  return (fts: Set<FeatureOrCategory>) => fts.has(ifPresent) && !m.every((r) => fts.has(r)) && message;
}

/**
 * Returns a message if subject is present
 */
export function includes(message: RulesMessage, ifPresent: FeatureOrCategory): Rule {
  return (fts: Set<FeatureOrCategory>) => fts.has(ifPresent) && message;
}

/**
 * Create a Set from an array of features, and be sure to add
 * all used categories to the Set.
 */
export function prepare(fts: FeatureOrCategory[]): Set<FeatureOrCategory> {
  const s = new Set<FeatureOrCategory>();
  for (const f of fts) {
    if (flags.includes(f as Flags)) {
      s.add(features.find((feat) => feat.flag === f)!.category);
    }
    s.add(f);
  }
  return s;
}
