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

    // Use `Bun.spawn` with inherited stdio (rather than the `$` shell, which
    // doesn't connect stdin to the terminal) so `npm publish` can prompt for an
    // OTP token interactively when run locally. On CI there's no TTY but npm
    // authenticates via OIDC/token and never prompts, so inheriting stdin is a
    // no-op there.
    const proc = Bun.spawn(["bunx", "npm", "publish", join(stage, tarball), ...args], {
      stdio: ["inherit", "inherit", "inherit"],
    });
    const exitCode = await proc.exited;
    assert(exitCode === 0, `npm publish failed for ${dir} (exit code ${exitCode})`);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
