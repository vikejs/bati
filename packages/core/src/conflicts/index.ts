import type { ErrorFormatter, FeaturesOrNamespaces } from "./utils";
import { prepare } from "./utils";
import rules from "./rules";

export function conflicts(fts: FeaturesOrNamespaces[], formatter: ErrorFormatter) {
  const sfts = prepare(fts);
  const messages: string[] = [];

  for (const rule of rules) {
    const result = rule(sfts);
    if (typeof result === "string") {
      messages.push(result);
    } else if (typeof result === "function") {
      messages.push(result(formatter));
    }
  }

  return messages;
}
