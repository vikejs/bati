import type * as Colorette from "colorette";
import { assert } from "./assert.js";
import type { VikeMeta } from "./types.js";

export interface BatiConfigStep {
  order?: number;
  step: string;
  type: "command" | "text";
}

export interface BatiConfig {
  if?: (meta: VikeMeta, packageManager?: string) => boolean;
  enforce?: "pre" | "post";
  nextSteps?: (meta: VikeMeta, packageManager: string, utils: typeof Colorette) => BatiConfigStep[];
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
  return config;
}
