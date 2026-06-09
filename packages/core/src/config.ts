import type * as Colorette from "colorette";
import { assert } from "./assert.js";
import type { EnvRegistryFactory } from "./env-registry.js";
import type { VikeMeta } from "./types.js";

export type { VikeMeta };

export interface BatiConfigStep {
  order?: number;
  step: string;
  type: "command" | "text";
}

export interface BatiKnipConfig {
  entry?: string[];
  ignoreDependencies?: string[];
  ignore?: string[];
  vite?: boolean;
}

export interface BatiConfig {
  if?: (meta: VikeMeta, packageManager?: string) => boolean;
  enforce?: "pre" | "post";
  nextSteps?: (meta: VikeMeta, packageManager: string, utils: typeof Colorette) => BatiConfigStep[];
  knip?: BatiKnipConfig;
  /** Env vars this feature contributes, gated on `meta` (see {@link EnvRegistryFactory}). */
  env?: EnvRegistryFactory;
  /**
   * Files (relative to the app root) this feature needs present in the production runtime, e.g.
   * migration scripts or config read at startup. Deploy targets (the Dockerfile generator) collect
   * every selected boilerplate's list and ship them. Use the function form to vary the list by `meta`;
   * a feature whose `if` gate already implies the list can use a plain array.
   */
  deploy?: string[] | ((meta: VikeMeta) => string[]);
}

// Small helper to provide type inference like Vite's defineConfig
export function defineConfig<T extends BatiConfig>(config: T): T {
  if ("enforce" in config) {
    assert(
      config.enforce === "pre" || config.enforce === "post",
      `'enforce' must be 'pre' or 'post', was ${config.enforce}`,
    );
  }
  if ("if" in config) {
    assert(typeof config.if === "function", `'if' must be a function`);
  }
  if ("nextSteps" in config) {
    assert(typeof config.nextSteps === "function", `'nextSteps' must be a function`);
  }
  if ("knip" in config) {
    assert(typeof config.knip === "object" && config.knip !== null, `'knip' must be an object`);
    if ("entry" in config.knip) {
      assert(Array.isArray(config.knip.entry), `'knip.entry' must be an array`);
    }
    if ("ignoreDependencies" in config.knip) {
      assert(Array.isArray(config.knip.ignoreDependencies), `'knip.ignoreDependencies' must be an array`);
    }
    if ("ignore" in config.knip) {
      assert(Array.isArray(config.knip.ignore), `'knip.ignore' must be an array`);
    }
    if ("vite" in config.knip) {
      assert(typeof config.knip.vite === "boolean", `'knip.vite' must be a boolean`);
    }
  }
  if ("env" in config) {
    assert(typeof config.env === "function", `'env' must be a function of meta`);
  }
  if ("deploy" in config) {
    assert(
      Array.isArray(config.deploy) || typeof config.deploy === "function",
      `'deploy' must be an array or a function of meta`,
    );
  }
  return config;
}
