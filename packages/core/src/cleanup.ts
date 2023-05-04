// @ts-ignore
import importFixer from "@magne4000/import-fixer";

export function cleanImports(code: string): string {
  const result = importFixer.fixImport("a.ts", code, [], true);
  return result.output;
}
