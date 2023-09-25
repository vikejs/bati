// The role of this file is to describe rules for packages which may conflict with one another
import type { features, Namespaces } from "../features";
import type { RulesMessage } from "./enum";

type Features = (typeof features)[number];
export type FeaturesOrNamespaces = Features | Namespaces;
export type Rule = (fts: Set<FeaturesOrNamespaces>) => null | undefined | false | RulesMessage;

/**
 * Returns a message if all given rules are not exclusive
 */
export function exclusive(message: RulesMessage, rules: FeaturesOrNamespaces[]): Rule {
  return (fts: Set<FeaturesOrNamespaces>) => rules.every((r) => fts.has(r)) && message;
}

/**
 * Returns a message if subject is present but rules are not
 */
export function requires(
  message: RulesMessage,
  ifPresent: FeaturesOrNamespaces,
  mustAlsoInclude: FeaturesOrNamespaces[],
): Rule {
  const m = Array.from(prepare(mustAlsoInclude));
  return (fts: Set<FeaturesOrNamespaces>) => fts.has(ifPresent) && !m.every((r) => fts.has(r)) && message;
}

/**
 * Create a Set from an array of features, and be sure to add
 * all used namespaces to the Set.
 */
export function prepare(fts: FeaturesOrNamespaces[]): Set<FeaturesOrNamespaces> {
  const s = new Set<FeaturesOrNamespaces>();
  for (const f of fts) {
    if (f.includes(":")) {
      s.add(f.split(":")[0] as Namespaces);
    }
    s.add(f);
  }
  return s;
}
