import ts from "typescript";

export function evalCondition(obj: string, meta: VikeMeta = {}) {
  obj = obj.replaceAll("import.meta", "VIKE_META");
  obj = `var VIKE_META = ${JSON.stringify(meta)};(${obj})`;

  obj = ts.transpile(obj, {
    strict: true,
    allowJs: true,
    checkJs: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    sourceMap: false,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    target: ts.ScriptTarget.ES2020,
    lib: ["DOM", "DOM.Iterable", "ESNext"],
    types: ["@types/node"],
  });

  return (0, eval)(obj);
}
