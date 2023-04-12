import ts from "typescript";

export function transpileTs(code: string) {
  return ts.transpile(code, {
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
}
