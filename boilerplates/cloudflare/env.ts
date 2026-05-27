import { committedValue, type EnvRecord, type EnvRegistry, isServerVar, secretDevValue } from "@batijs/core";

// Renders the wrangler.jsonc `vars` block — the runtime env the Worker needs.
// Core owns the data model; this sink's formatting policy lives here. Public
// build-time vars stay in `.env`, not here.
export function wranglerEnv(registry: EnvRegistry): EnvRecord {
  const vars: EnvRecord = {};
  for (const def of registry.filter(isServerVar)) {
    vars[def.key] = def.scope === "secret" ? secretDevValue(def) : committedValue(def, "wrangler");
  }
  return vars;
}
