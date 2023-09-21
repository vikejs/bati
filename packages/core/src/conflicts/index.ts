import type { FeaturesOrNamespaces } from "./utils";
import { prepare } from "./utils";
import rules from "./rules";
import { RulesMessage } from "./enum";

export { rules, RulesMessage };

export function conflicts<T = string>(fts: FeaturesOrNamespaces[], errors: Record<RulesMessage, T | string>) {
  const sfts = prepare(fts);
  const messages: (string | T)[] = [];

  for (const rule of rules) {
    const result = rule(sfts);
    if (typeof result === "string") {
      messages.push(result);
    } else if (typeof result === "number") {
      messages.push(errors[result]);
    }
  }

  return messages;
}
