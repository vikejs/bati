// Stand-in for `pnpm deploy --prod`: pack a workspace package and its transitive workspace deps into
// <out>/, then install the registry deps those packages pull in (e.g. @batijs/core's @codegraft/* and
// tree-sitter-*, which stay external because they load WASM by URL and can't be bundled) — ready to
// publish or run.

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
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
  const external = new Map<string, string>();
  await stageWorkspaceDeps(srcDir, join(outDir, "node_modules"), byName, new Set(), external);
  await installExternalDeps(external, outDir);

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
  external: Map<string, string>,
) {
  const pkg = JSON.parse(await readFile(join(srcDir, "package.json"), "utf8"));
  for (const [name, spec] of Object.entries<string>(pkg.dependencies ?? {})) {
    const ws = byName.get(name);
    if (!ws) {
      external.set(name, spec); // a registry dep — collect it for one install pass at the end
      continue;
    }
    if (visited.has(name)) continue;
    visited.add(name);
    const depDest = join(nodeModulesDir, name);
    await mkdir(depDest, { recursive: true });
    await packInto(ws.dir, depDest);
    await stageWorkspaceDeps(ws.dir, nodeModulesDir, byName, visited, external);
  }
}

/** Install the collected registry deps and fold their resolved tree into the deploy's node_modules.
 *  One isolated install gives the full transitive closure (web-tree-sitter, magic-string, …); the
 *  staged workspace packages never collide with it, so the merge is a plain overlay. */
async function installExternalDeps(external: Map<string, string>, outDir: string) {
  if (external.size === 0) return;
  const scratch = join(outDir, ".__bati_ext__");
  await rm(scratch, { recursive: true, force: true });
  await mkdir(scratch, { recursive: true });
  const manifest = { name: "bati-deploy-ext", private: true, dependencies: Object.fromEntries(external) };
  await writeFile(join(scratch, "package.json"), JSON.stringify(manifest));
  await $`bun install`.cwd(scratch).quiet();
  await cp(join(scratch, "node_modules"), join(outDir, "node_modules"), { recursive: true, force: true });
  await rm(scratch, { recursive: true, force: true });
}

await main();
