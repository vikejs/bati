/**
 * Stand-in for `pnpm deploy --prod --filter=<src> <out>` under Bun.
 *
 *   bun run scripts/deploy.ts <src-pkg-dir> <out-dir>
 *
 * Packs <src> with `bun pm pack` (which rewrites `workspace:*` specifiers to
 * the resolved version), extracts it into <out>, then recursively packs every
 * workspace dependency listed in the source's `dependencies` into
 * `<out>/node_modules/<name>/`. Non-workspace runtime deps would still need
 * `bun install --production` — Bati doesn't have any (all third-party deps
 * are bundled by tsdown), so install is skipped.
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";
import { extract } from "tar";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type WorkspaceMap = Map<string, string>;

async function loadWorkspaceMap(): Promise<WorkspaceMap> {
  const map: WorkspaceMap = new Map();
  const root = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  for (const glob of (root.workspaces ?? []) as string[]) {
    const star = glob.endsWith("/*");
    const base = star ? glob.slice(0, -2) : glob;
    const dir = join(repoRoot, base);
    if (star) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) await register(map, join(dir, entry.name));
      }
    } else {
      await register(map, dir);
    }
  }
  return map;
}

async function register(map: WorkspaceMap, pkgDir: string) {
  const pkgJson = join(pkgDir, "package.json");
  if (!existsSync(pkgJson)) return;
  const pkg = JSON.parse(await readFile(pkgJson, "utf8"));
  if (pkg.name) map.set(pkg.name, pkgDir);
}

async function packInto(srcDir: string, destDir: string) {
  const tmp = join(destDir, ".__bati_pack__");
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  await $`bun pm pack --destination ${tmp}`.cwd(srcDir).quiet();
  const tarball = (await readdir(tmp)).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error(`bun pm pack produced no tarball for ${srcDir}`);
  await extract({ file: join(tmp, tarball), cwd: destDir, strip: 1 });
  await rm(tmp, { recursive: true, force: true });
}

async function stageWorkspaceDeps(srcDir: string, nodeModulesDir: string, ws: WorkspaceMap, visited: Set<string>) {
  const pkg = JSON.parse(await readFile(join(srcDir, "package.json"), "utf8"));
  const deps = { ...(pkg.dependencies ?? {}) };
  for (const name of Object.keys(deps)) {
    const depSrc = ws.get(name);
    if (!depSrc || visited.has(name)) continue;
    visited.add(name);
    const depDest = join(nodeModulesDir, name);
    await mkdir(depDest, { recursive: true });
    await packInto(depSrc, depDest);
    await stageWorkspaceDeps(depSrc, nodeModulesDir, ws, visited);
  }
}

async function main() {
  const [, , src, out] = process.argv;
  if (!src || !out) {
    console.error("usage: bun run scripts/deploy.ts <src-pkg-dir> <out-dir>");
    process.exit(2);
  }
  const srcDir = resolve(src);
  const outDir = resolve(out);

  if (!existsSync(join(srcDir, "package.json"))) {
    console.error(`no package.json at ${srcDir}`);
    process.exit(2);
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const ws = await loadWorkspaceMap();
  await packInto(srcDir, outDir);
  await stageWorkspaceDeps(srcDir, join(outDir, "node_modules"), ws, new Set());

  console.log(`deployed ${srcDir} -> ${outDir}`);
}

await main();
