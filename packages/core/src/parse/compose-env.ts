import { isSeq, parseDocument } from "yaml";
import { assert } from "../assert.js";

/**
 * Append `KEY=value` items to `services.<service>.environment` of a docker-compose document. Used to
 * inject the env-registry-derived env block (see `composeEnvEntries`) without the compose boilerplate
 * hardcoding vars. Independent of the `$$` codemod pass — this edits a real, already-rendered compose
 * file via the `yaml` library.
 */
export function setComposeEnvironment(code: string, entries: string[], service = "app"): string {
  if (entries.length === 0) return code;

  const doc = parseDocument(code);
  const env = doc.getIn(["services", service, "environment"]);
  assert(isSeq(env), `compose service '${service}' has no 'environment' list to extend`);
  for (const entry of entries) env.add(entry);

  return doc.toString();
}
