import { transpileTs } from "./transpile-ts";

export function evalCondition(code: string, meta: VikeMeta = {}) {
  code = code.replaceAll("import.meta", "VIKE_META");
  code = `var VIKE_META = ${JSON.stringify(meta)};(${code})`;
  code = transpileTs(code);

  return (0, eval)(code);
}
