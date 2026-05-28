import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

// Pack with `bun pm pack` (rewrites `workspace:*` from the lockfile), then
// hand the tarball to `npm publish` so we keep OIDC trusted publishing +
// provenance, which `bun publish` doesn't support yet (oven-sh/bun#15601).
export async function packAndPublish(dir: string, args: string[]) {
  const stage = await mkdtemp(join(tmpdir(), "bati-publish-"));
  try {
    await $`bun pm pack --destination ${stage}`.cwd(dir).quiet();
    const tarball = (await readdir(stage)).find((f) => f.endsWith(".tgz"));
    assert(tarball, `bun pm pack produced no tarball in ${dir}`);
    await $`bunx npm publish ${join(stage, tarball)} ${args}`;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
