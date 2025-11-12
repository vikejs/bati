import { assert } from "./assert.js";
import type { VikeMeta } from "./types.js";

export interface BatiConfig {
  if?: (meta: VikeMeta, packageManager?: string) => boolean;
  enforce?: "pre" | "post";
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
  return config;
}
