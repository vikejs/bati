import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type Workspace = {
  name: string;
  dir: string;
  pkg: Record<string, unknown>;
};

export async function loadWorkspaces(): Promise<Workspace[]> {
  const root = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert(Array.isArray(root.workspaces), "root package.json: workspaces must be an array");

  const out: Workspace[] = [];
  for (const glob of root.workspaces as string[]) {
    const star = glob.endsWith("/*");
    const baseDir = join(repoRoot, star ? glob.slice(0, -2) : glob);
    const dirs = star
      ? (await readdir(baseDir, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .map((e) => join(baseDir, e.name))
      : [baseDir];

    for (const dir of dirs) {
      const pkgJson = join(dir, "package.json");
      assert(existsSync(pkgJson), `workspace dir missing package.json: ${dir}`);
      const pkg = JSON.parse(await readFile(pkgJson, "utf8"));
      assert(typeof pkg.name === "string", `workspace package missing name: ${dir}`);
      out.push({ name: pkg.name, dir, pkg });
    }
  }
  return out;
}
