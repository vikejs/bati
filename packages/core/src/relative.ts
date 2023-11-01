import path from "path";

export function relative(a: string, b: string): string {
  const x = a.replace(/[\\/]+/g, "/");
  const y = b.replace(/[\\/]+/g, "/");

  const rel = path.posix.relative(path.dirname(x), y);

  return rel.startsWith("../") ? rel : "./" + rel;
}
