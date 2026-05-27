import { type EnvRecord, type EnvRegistry, envVarApplies, type VikeMeta } from "@batijs/core";

// Renders the env vars for the two sinks this boilerplate owns: the
// docker-compose `environment:` list and the Dockerfile runtime `ENV`. Core
// owns only the data model; the sink-specific formatting policy lives here.

/**
 * `KEY=<expr>` lines for the docker-compose `services.<app>.environment` list.
 * Secrets are pulled from the host (`${KEY}`); defaulted vars are host-overridable
 * (`${KEY:-<default>}`); public vars are skipped.
 */
export function composeEnvEntries(registry: EnvRegistry | undefined, meta: VikeMeta): string[] {
  if (!registry) return [];

  const lines: string[] = [];
  for (const def of registry) {
    if (def.scope === "public") continue;
    if (!envVarApplies(def, meta, "compose")) continue;

    if (def.scope === "secret") {
      lines.push(`${def.key}=\${${def.key}}`);
    } else {
      const fallback = def.perSink?.compose ?? def.default ?? "";
      lines.push(`${def.key}=\${${def.key}:-${fallback}}`);
    }
  }
  return lines;
}

/** A group of Dockerfile `ENV` defaults sharing a comment. */
export interface DockerfileEnvGroup {
  comment?: string;
  vars: EnvRecord;
}

/**
 * Dockerfile `ENV` defaults grouped by `group` (preserving first-seen order), so
 * the caller can emit one `.env(vars, { comment })` per feature. Secrets default
 * to empty (compose overrides them at runtime); public vars are skipped.
 */
export function serverEnvDefaults(registry: EnvRegistry | undefined, meta: VikeMeta): DockerfileEnvGroup[] {
  if (!registry) return [];

  const groups = new Map<string, DockerfileEnvGroup>();
  for (const def of registry) {
    if (def.scope === "public") continue;
    if (!envVarApplies(def, meta, "dockerfile")) continue;

    const value = def.scope === "secret" ? "" : (def.perSink?.dockerfile ?? def.default ?? "");
    const groupKey = def.group ?? "";
    let group = groups.get(groupKey);
    if (!group) {
      group = { comment: def.group, vars: {} };
      groups.set(groupKey, group);
    }
    group.vars[def.key] = value;
  }

  return [...groups.values()];
}
