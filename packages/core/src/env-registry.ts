/**
 * Data model for the declarative env-var registry.
 *
 * Each feature declares the env vars it needs once (in its `bati.config.ts`);
 * the registry is merged across all selected boilerplates and threaded to
 * transformers via `TransformerProps.env`. Core owns only this shared shape —
 * the actual rendering for each sink (`.env`, docker-compose, Dockerfile) lives
 * in the boilerplate that owns that sink.
 */
import type { VikeMeta } from "./types.js";

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

/** Whether a declaration applies to the given sink under the current meta. */
export function envVarApplies(def: EnvVarDef, meta: VikeMeta, sink: EnvSink): boolean {
  return def.when ? def.when({ meta, sink }) : true;
}
