import { defineCodemod } from "@codegraft/codemod";
import type { Collection } from "@codegraft/core";
import { assert } from "./assert.js";
import type { TransformerProps } from "./types.js";

// The config-editing primitives a `$…config.ts.ts` transformer composes.
export type { ConfigObject, ConfigValue } from "./codemods/index.js";
export { addVitePlugin, defineConfigArg, mergeObject } from "./codemods/index.js";

/** Run `edit` over a config file's existing content as a one-off codemod — `edit` composes
 *  `addVitePlugin` / `mergeObject(defineConfigArg(root), …)`. A `$…config.ts.ts` file only ever
 *  transforms a config that an earlier boilerplate already wrote, so the content is always present. */
export async function transformConfig(
  props: Pick<TransformerProps, "readfile">,
  edit: (root: Collection) => void,
): Promise<string> {
  const content = await props.readfile?.();
  assert(content !== undefined, "transformConfig: no existing config file to transform");
  return (await defineCodemod({ format: true }, edit).forTarget("tsx")).transform(content, {});
}
