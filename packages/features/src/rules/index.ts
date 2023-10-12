import { RulesMessage } from "./enum.js";
import rules from "./rules.js";
import { prepare, type FeatureOrCategory } from "./utils.js";

export { rules, RulesMessage };

export function execRules<T>(fts: FeatureOrCategory[], rulesMessages: Record<RulesMessage, T>) {
  const sfts = prepare(fts);
  const messages: T[] = [];

  for (const rule of rules) {
    const result = rule(sfts);
    if (typeof result === "number") {
      if (result in rulesMessages) {
        messages.push(rulesMessages[result]);
      } else {
        console.warn("No handler defined for rule", result);
      }
    }
  }

  return messages;
}
