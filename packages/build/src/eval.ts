import ts, { type CompilerOptions } from "typescript";
import tsconfig from "../tsconfig.json" assert { type: "json" };

export function evalCondition(obj: string, meta: VikeMeta = {}) {
  obj = obj.replaceAll("import.meta", "VIKE_META");
  obj = `var VIKE_META = ${JSON.stringify(meta)};(${obj})`;

  obj = ts.transpile(obj, {
    ...(tsconfig.compilerOptions as unknown as CompilerOptions),
    sourceMap: false,
  });

  return (0, eval)(obj);
}
