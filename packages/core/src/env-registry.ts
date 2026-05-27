/**
 * Declarative env-var registry. Each feature exposes an `env(meta)` producer in
 * its `bati.config.ts`; the CLI runs every selected boilerplate's producer,
 * merges the results into one registry, and threads it to transformers via
 * `TransformerProps.env`. Meta-gating happens in the producer, so the merged
 * registry is already feature-resolved — consumers only filter by sink. Core
 * owns this shape; each sink's rendering lives in the boilerplate that owns it
 * (`.env` in `shared`, compose/Dockerfile in `docker-compose`).
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
  /** Destinations to emit to; defaults to all. */
  sinks?: EnvSink[];
}

export type EnvRegistry = EnvVarDef[];

/** A feature's env-var producer; meta-gating lives here, not at render time. */
export type EnvRegistryFactory = (meta: VikeMeta) => EnvRegistry;

/** Whether a declaration targets the given sink. */
export function appliesToSink(def: EnvVarDef, sink: EnvSink): boolean {
  return def.sinks?.includes(sink) ?? true;
}
