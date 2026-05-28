// Stand-in for `pnpm deploy --prod`: pack a workspace package and its
// transitive workspace deps into <out>/ ready to publish or run.

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";
import { extract } from "tar";
import { loadWorkspaces, type Workspace } from "./lib/workspaces.ts";

async function main() {
  const [, , src, out] = process.argv;
  assert(src && out, "usage: bun run scripts/deploy.ts <src-pkg-dir> <out-dir>");

  const srcDir = resolve(src);
  const outDir = resolve(out);
  assert(existsSync(join(srcDir, "package.json")), `no package.json at ${srcDir}`);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const byName = new Map((await loadWorkspaces()).map((w) => [w.name, w] as const));
  await packInto(srcDir, outDir);
  await stageWorkspaceDeps(srcDir, join(outDir, "node_modules"), byName, new Set());

  console.log(`deployed ${srcDir} -> ${outDir}`);
}

async function packInto(srcDir: string, destDir: string) {
  const tmp = join(destDir, ".__bati_pack__");
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  await $`bun pm pack --destination ${tmp}`.cwd(srcDir).quiet();
  const tarball = (await readdir(tmp)).find((f) => f.endsWith(".tgz"));
  assert(tarball, `bun pm pack produced no tarball for ${srcDir}`);
  await extract({ file: join(tmp, tarball), cwd: destDir, strip: 1 });
  await rm(tmp, { recursive: true, force: true });
}

async function stageWorkspaceDeps(
  srcDir: string,
  nodeModulesDir: string,
  byName: Map<string, Workspace>,
  visited: Set<string>,
) {
  const pkg = JSON.parse(await readFile(join(srcDir, "package.json"), "utf8"));
  for (const name of Object.keys(pkg.dependencies ?? {})) {
    const ws = byName.get(name);
    if (!ws || visited.has(name)) continue;
    visited.add(name);
    const depDest = join(nodeModulesDir, name);
    await mkdir(depDest, { recursive: true });
    await packInto(ws.dir, depDest);
    await stageWorkspaceDeps(ws.dir, nodeModulesDir, byName, visited);
  }
}

await main();
