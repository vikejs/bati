import type { VikeMeta } from "../../types.js";
import { Extractor } from "../linters/common.js";
import { getLang } from "./lang.js";
import { removeUnusedImports } from "./remove-unused-imports.js";
import { transformTs } from "./transform-ts.js";
import { transformVue } from "./transform-vue.js";

export function transform(code: string, filename: string, meta: VikeMeta) {
  const extractor = new Extractor(filename);
  let transformed: string;

  if (filename.endsWith(".vue")) {
    transformed = transformVue(code, filename, meta, extractor);
  } else {
    const lang = getLang(filename);
    if (lang) {
      transformed = transformTs(code, lang, filename, meta, extractor);
      transformed = removeUnusedImports(transformed, lang, extractor);
    } else {
      transformed = code;
    }
  }

  return { code: transformed, context: extractor };
}
