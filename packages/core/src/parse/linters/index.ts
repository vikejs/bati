import type { VikeMeta } from "../../types.js";
import { verifyAndFix } from "./common.js";
import tsLinterConfig from "./linter-ts.js";
import vueLinterConfig from "./linter-vue.js";

export function transform(code: string, filename: string, meta: VikeMeta) {
  return verifyAndFix(code, [...tsLinterConfig(meta).config, ...vueLinterConfig(meta).config], filename);
}
