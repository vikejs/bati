/**
 * Single source of truth for environment variables across the boilerplates.
 *
 * Each feature declares the env vars it needs once (in its `bati.config.ts`),
 * and the various sinks — the generated `.env`, the docker-compose
 * `environment:` block, and the Dockerfile `ENV` instructions — are *derived*
 * from the merged registry rather than each re-declaring the same key, default,
 * comment and condition. This keeps ownership with the feature and removes the
 * cross-feature coupling that previously forced e.g. the docker-compose
 * boilerplate to know about auth0/sentry/database vars.
 */
import type { EnvRecord } from "./dockerfile.js";
import type { VikeMeta } from "./types.js";
import { appendToEnv } from "./utils/env.js";

/** Destinations a declared env var can be emitted to. */
export type EnvSink = "dotenv" | "compose" | "dockerfile";

/**
 * How a var behaves across sinks:
 * - `secret`: no committed value. `.env` gets a dev/test value (or empty),
 *    compose pulls it from the host (`${KEY}`), the Dockerfile defaults it empty.
 * - `server-default`: has a safe default. `.env`/Dockerfile use it directly,
 *    compose makes it host-overridable (`${KEY:-<default>}`).
 * - `public`: build-time/client var (e.g. `PUBLIC_ENV__*`). Emitted to `.env`
 *    only — never to the server runtime env of compose/Dockerfile.
 */
export type EnvScope = "secret" | "server-default" | "public";

export interface EnvVarContext {
  meta: VikeMeta;
  sink: EnvSink;
}

export interface EnvVarDef {
  /** The variable name, e.g. `DATABASE_URL`. Declared exactly once. */
  key: string;
  scope: EnvScope;
  /** Help text for the `.env` file (may be multi-line). */
  comment?: string;
  /** Default value for `server-default` / `public` scopes. */
  default?: string;
  /**
   * Per-sink value overrides for the rare cases where the value legitimately
   * differs by destination (e.g. a container path vs. a local path).
   */
  perSink?: Partial<Record<EnvSink, string>>;
  /** For `secret` scope: env var to read a dev/test value from when generating `.env`. */
  devValueFrom?: string;
  /**
   * Short label used to group + comment vars in the compose/Dockerfile output
   * (e.g. `"auth0"`). Defaults to no comment.
   */
  group?: string;
  /**
   * Gate the var per (meta, sink). The owning feature being selected is already
   * implied (the registry only contains selected boilerplates' vars), so this is
   * for finer conditions, e.g. excluding a var from `.env` under cloudflare.
   * Defaults to "emit everywhere".
   */
  when?: (ctx: EnvVarContext) => boolean;
}

export type EnvRegistry = EnvVarDef[];

function applies(def: EnvVarDef, meta: VikeMeta, sink: EnvSink): boolean {
  return def.when ? def.when({ meta, sink }) : true;
}

/** Value written to `.env` for a given declaration. */
function dotenvValue(def: EnvVarDef): string {
  if (def.perSink?.dotenv !== undefined) return def.perSink.dotenv;
  if (def.scope === "secret") {
    return def.devValueFrom ? (process.env[def.devValueFrom] ?? "") : "";
  }
  return def.default ?? "";
}

/**
 * Render the full `.env` file from the registry, reusing `appendToEnv` so the
 * formatting (quoting, comment prefixing, blank-line separation) is identical to
 * the per-feature transformers this replaces.
 *
 * Returns `undefined` when no var targets the `.env` sink, so the caller can
 * skip writing an empty file.
 */
export function renderDotenv(registry: EnvRegistry | undefined, meta: VikeMeta): string | undefined {
  if (!registry || registry.length === 0) return undefined;

  let content: string | undefined;
  let emitted = false;

  for (const def of registry) {
    if (!applies(def, meta, "dotenv")) continue;
    content = appendToEnv(content, def.key, dotenvValue(def), def.comment);
    emitted = true;
  }

  return emitted ? content : undefined;
}

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
    if (!applies(def, meta, "compose")) continue;

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
    if (!applies(def, meta, "dockerfile")) continue;

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
