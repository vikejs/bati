import type { VikeMeta } from "../../types.js";
import { verifyAndFix } from "./common.js";
import tsLinterConfig from "./linter-ts.js";
import vueLinterConfig from "./linter-vue.js";
import pluginRemoveUnusedImports from "./plugin-remove-unused-imports.js";

export function transform(code: string, filename: string, meta: VikeMeta) {
  return verifyAndFix(
    code,
    [...tsLinterConfig(meta).config, ...vueLinterConfig(meta).config, ...pluginRemoveUnusedImports().config],
    filename,
  );
}
