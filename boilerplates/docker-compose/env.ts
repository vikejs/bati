import { committedValue, type EnvRecord, type EnvRegistry, isServerVar } from "@batijs/core";

/**
 * `KEY=<expr>` lines for the docker-compose `services.<app>.environment` list:
 * secrets are pulled from the host (`${KEY}`), defaulted vars are host-overridable
 * (`${KEY:-<default>}`).
 */
export function composeEnvEntries(registry: EnvRegistry): string[] {
  return registry
    .filter(isServerVar)
    .map((def) =>
      def.scope === "secret"
        ? `${def.key}=\${${def.key}}`
        : `${def.key}=\${${def.key}:-${committedValue(def, "compose")}}`,
    );
}

/** A group of Dockerfile `ENV` defaults sharing a comment. */
export interface DockerfileEnvGroup {
  comment?: string;
  vars: EnvRecord;
}

/**
 * Dockerfile `ENV` defaults grouped by `group` (first-seen order), one
 * `.env(vars, { comment })` per group. Secrets default to empty — compose
 * overrides them at runtime.
 */
export function serverEnvDefaults(registry: EnvRegistry): DockerfileEnvGroup[] {
  const groups = new Map<string, DockerfileEnvGroup>();
  for (const def of registry.filter(isServerVar)) {
    const groupKey = def.group ?? "";
    let group = groups.get(groupKey);
    if (!group) {
      group = { comment: def.group, vars: {} };
      groups.set(groupKey, group);
    }
    group.vars[def.key] = def.scope === "secret" ? "" : committedValue(def, "dockerfile");
  }
  return [...groups.values()];
}
