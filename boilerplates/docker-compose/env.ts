import { appliesToSink, type EnvRecord, type EnvRegistry, type EnvSink, type EnvVarDef } from "@batijs/core";

// Renders the env vars for the two sinks this boilerplate owns: the
// docker-compose `environment:` list and the Dockerfile runtime `ENV`. Core
// owns only the data model; the sink-specific formatting policy lives here.

/**
 * `KEY=<expr>` lines for the docker-compose `services.<app>.environment` list:
 * secrets are pulled from the host (`${KEY}`), defaulted vars are host-overridable
 * (`${KEY:-<default>}`).
 */
export function composeEnvEntries(registry: EnvRegistry): string[] {
  return serverVars(registry, "compose").map((def) =>
    def.scope === "secret"
      ? `${def.key}=\${${def.key}}`
      : `${def.key}=\${${def.key}:-${def.perSink?.compose ?? def.default ?? ""}}`,
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
  for (const def of serverVars(registry, "dockerfile")) {
    const groupKey = def.group ?? "";
    let group = groups.get(groupKey);
    if (!group) {
      group = { comment: def.group, vars: {} };
      groups.set(groupKey, group);
    }
    group.vars[def.key] = def.scope === "secret" ? "" : (def.perSink?.dockerfile ?? def.default ?? "");
  }
  return [...groups.values()];
}

// Vars that reach a container's server runtime: non-public declarations that
// target this sink. Public (client/build-time) vars never get here.
function serverVars(registry: EnvRegistry, sink: EnvSink): EnvVarDef[] {
  return registry.filter((def) => def.scope !== "public" && appliesToSink(def, sink));
}
