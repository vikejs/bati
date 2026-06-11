import { defineCodemod } from "@codegraft/codemod";
import type { Collection } from "@codegraft/core";
import type { TransformerProps } from "./types.js";

// The config-editing primitives a `$…config.ts.ts` transformer composes (the magicast replacements).
export type { ConfigObject, ConfigValue } from "./codemods/index.js";
export { addVitePlugin, defineConfigArg, mergeObject } from "./codemods/index.js";

/**
 * Build and run a one-off codemod over a config file — the codegraft replacement for magicast's
 * `loadAsMagicast(props)` … `mod.generate().code`. `edit` composes `addVitePlugin` /
 * `mergeObject(defineConfigArg(root), …)` against the previous content; `undefined` when there is none.
 */
export async function transformConfig(
  props: Pick<TransformerProps, "readfile">,
  edit: (root: Collection) => void,
): Promise<string | undefined> {
  const content = await props.readfile?.();
  if (content === undefined) return undefined;
  return (await defineCodemod({ format: true }, edit).forTarget("tsx")).transform(content, {});
}
