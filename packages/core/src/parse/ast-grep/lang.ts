import { Lang } from "@ast-grep/napi";

export function getLang(filename: string): Lang | null {
  if (filename.endsWith(".ts")) return Lang.TypeScript;
  if (filename.endsWith(".js")) return Lang.TypeScript;
  if (filename.endsWith(".tsx")) return Lang.Tsx;
  if (filename.endsWith(".jsx")) return Lang.Tsx;
  return null;
}
