import { RulesMessage } from "./enum";
import rules from "./rules";
import { prepare, type FeaturesOrNamespaces } from "./utils";

export { rules, RulesMessage };

export function execRules<T>(fts: FeaturesOrNamespaces[], errors: Record<RulesMessage, T>) {
  const sfts = prepare(fts);
  const messages: T[] = [];

  for (const rule of rules) {
    const result = rule(sfts);
    if (typeof result === "number") {
      messages.push(errors[result]);
    }
  }

  return messages;
}
