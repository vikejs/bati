import type { VikeMeta } from "../../types.js";
import { verifyAndFix } from "./common.js";
import vueLinterConfig from "./vue.js";

export function transform(code: string, filename: string, meta: VikeMeta) {
  return verifyAndFix(code, [...vueLinterConfig(meta).config], filename);
}
