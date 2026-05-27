/**
 * Declarative env-var registry. Each feature declares the vars it needs in its
 * `bati.config.ts`; the CLI merges all selected boilerplates into one registry
 * and threads it to transformers via `TransformerProps.env`. Core owns only this
 * shape — each sink's rendering lives in the boilerplate that owns it (`.env` in
 * `shared`, compose/Dockerfile in `docker-compose`).
 */
import type { VikeMeta } from "./types.js";

/** Destinations a declared env var can be emitted to. */
export type EnvSink = "dotenv" | "compose" | "dockerfile";

/**
 * What kind of value a var carries:
 * - `secret`: no committed value; the host/CI supplies it at runtime.
 * - `server-default`: a safe default committed to the repo.
 * - `public`: a client/build-time var (e.g. `PUBLIC_ENV__*`), never part of the server runtime.
 */
export type EnvScope = "secret" | "server-default" | "public";

export interface EnvVarContext {
  meta: VikeMeta;
  sink: EnvSink;
}

export interface EnvVarDef {
  /** Variable name, e.g. `DATABASE_URL`. */
  key: string;
  scope: EnvScope;
  /** `.env` help text (may be multi-line). */
  comment?: string;
  /** Default value for `server-default` / `public` scopes. */
  default?: string;
  /** Value overrides per destination, e.g. a container path vs. a local one. */
  perSink?: Partial<Record<EnvSink, string>>;
  /** `secret` only: env var to read a dev/test value from when generating `.env`. */
  devValueFrom?: string;
  /** Groups + comments vars in the compose/Dockerfile output, e.g. `"auth0"`. */
  group?: string;
  /**
   * Finer per-(meta, sink) gate; selection of the owning feature is already
   * implied. Defaults to applying everywhere.
   */
  when?: (ctx: EnvVarContext) => boolean;
}

export type EnvRegistry = EnvVarDef[];

/** Whether a declaration applies to the given sink under the current meta. */
export function envVarApplies(def: EnvVarDef, meta: VikeMeta, sink: EnvSink): boolean {
  return def.when ? def.when({ meta, sink }) : true;
}
