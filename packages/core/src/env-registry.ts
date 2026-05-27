/**
 * Declarative env-var registry. Each feature exposes an `env(meta)` producer in
 * its `bati.config.ts`; the CLI runs every selected boilerplate's producer,
 * merges the results, and threads them to transformers via `TransformerProps.env`.
 *
 * A declaration is pure data and never names a destination. Routing is by `scope`,
 * owned by each sink renderer (in the boilerplate that owns the sink); core owns
 * this shape and the shared value resolvers below.
 */
import type { VikeMeta } from "./types.js";

/** Destinations a declared env var can be emitted to. */
export type EnvSink = "dotenv" | "compose" | "dockerfile" | "wrangler";

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
  /** `secret` only: env var to read a dev/test value from. */
  devValueFrom?: string;
  /** Groups + comments vars in the compose/Dockerfile output, e.g. `"auth0"`. */
  group?: string;
}

export type EnvRegistry = EnvVarDef[];

/** A feature's env-var producer; meta-gating (does the var apply?) lives here. */
export type EnvRegistryFactory = (meta: VikeMeta) => EnvRegistry;

/** Server-runtime vars: everything but the client/build-time `public` ones. */
export function isServerVar(def: EnvVarDef): boolean {
  return def.scope !== "public";
}

/** The committed value a non-secret var contributes to a sink. */
export function committedValue(def: EnvVarDef, sink: EnvSink): string {
  return def.perSink?.[sink] ?? def.default ?? "";
}

/** A secret's dev/test value, from its `devValueFrom` env var (empty if unset). */
export function secretDevValue(def: EnvVarDef): string {
  return def.devValueFrom ? (process.env[def.devValueFrom] ?? "") : "";
}
