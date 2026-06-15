import type { Collection } from "@codegraft/core";
import { assert } from "../assert.js";
import { unquote } from "./text.js";

// Config-literal edits over a codegraft `Collection`: locate the `defineConfig({…})` argument
// (`defineConfigArg`), register a Vite plugin (`addVitePlugin`), and deep-merge into an object
// literal (`mergeObject`).

/** A config value: raw code text for a leaf (`"true"`, `'"react-jsx"'`, `'new URL(…)'`), or a nested object. */
export type ConfigValue = string | ConfigObject;
export interface ConfigObject {
  [key: string]: ConfigValue;
}

/** The object literal argument of the file's `defineConfig(...)` call. */
export function defineConfigArg(root: Collection): Collection {
  return root.find("call_expression", { function: "defineConfig" }).first().field("arguments").children().first();
}

/** Register a Vite plugin: append the plugin call `ctor(options?)` to the `plugins` array
 *  (idempotently) and ensure its import. */
export function addVitePlugin(
  root: Collection,
  { from, constructor: ctor, named, options }: { from: string; constructor: string; named?: boolean; options?: string },
): void {
  const pair = directPair(defineConfigArg(root), "plugins");
  assert(pair.size() > 0, `addVitePlugin(${ctor}): the config has no \`plugins\` array to append to`);
  const plugins = pair.field("value");
  if (plugins.find("call_expression", { function: ctor }).size() > 0) return; // already registered
  plugins.append(`${ctor}(${options ?? ""})`);
  root.ensureImport(named ? `import { ${ctor} } from "${from}";` : `import ${ctor} from "${from}";`);
}

/** Deep-merge `source` into an object literal: append absent keys, recurse into nested objects
 *  present on both sides, replace otherwise. */
export function mergeObject(object: Collection, source: ConfigObject): void {
  for (const [key, value] of Object.entries(source)) {
    const pair = directPair(object, key);
    if (pair.size() === 0) object.append(`${propKey(key)}: ${serialize(value)}`);
    else if (typeof value !== "string" && pair.field("value").type === "object")
      mergeObject(pair.field("value"), value);
    else pair.field("value").replaceWith(serialize(value));
  }
}

/** The object's own `pair` whose key is `key` — a direct child, so a nested same-named key is never hit. */
function directPair(object: Collection, key: string): Collection {
  return object
    .children()
    .filter((pair) => pair.type === "pair" && unquote(pair.field("key").text) === key)
    .first();
}

/** A `ConfigObject` as object-literal text; leaves are emitted verbatim (they are already code). */
function serialize(value: ConfigValue): string {
  if (typeof value === "string") return value;
  return `{ ${Object.entries(value)
    .map(([key, v]) => `${propKey(key)}: ${serialize(v)}`)
    .join(", ")} }`;
}

/** A property key as it appears in a literal — quoted unless it is a plain identifier. */
function propKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
