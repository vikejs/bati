import { committedValue, type EnvRecord, type EnvRegistry, isServerVar, secretDevValue } from "@batijs/core";

export function wranglerEnv(registry: EnvRegistry): EnvRecord {
  const vars: EnvRecord = {};
  for (const def of registry.filter(isServerVar)) {
    vars[def.key] = def.scope === "secret" ? secretDevValue(def) : committedValue(def, "wrangler");
  }
  return vars;
}
