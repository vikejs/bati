/**
 * Replaces `pnpm -r --filter "!@batijs/elements" publish`.
 *
 * `bun --filter` only works with `bun install`, `bun outdated`, and `bun run
 * <script>` — not with the `bun publish` subcommand — so iterate manually.
 *
 *   bun run scripts/publish.ts [extra-args-forwarded-to-bun-publish...]
 *
 * Skips:
 *   - @batijs/elements (has its own release-widget flow)
 *   - packages marked `"private": true`
 */
import { $ } from "bun";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDE = new Set(["@batijs/elements"]);

async function findPublishablePackages(): Promise<{ name: string; dir: string }[]> {
  const root = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  const targets: { name: string; dir: string }[] = [];

  for (const glob of (root.workspaces ?? []) as string[]) {
    const star = glob.endsWith("/*");
    const base = star ? glob.slice(0, -2) : glob;
    const dir = join(repoRoot, base);
    const candidates = star
      ? (await readdir(dir, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .map((e) => join(dir, e.name))
      : [dir];

    for (const pkgDir of candidates) {
      const pkgJson = join(pkgDir, "package.json");
      if (!existsSync(pkgJson)) continue;
      const pkg = JSON.parse(await readFile(pkgJson, "utf8"));
      if (!pkg.name) continue;
      if (pkg.private) continue;
      if (EXCLUDE.has(pkg.name)) continue;
      targets.push({ name: pkg.name, dir: pkgDir });
    }
  }
  return targets;
}

const forwardedArgs = process.argv.slice(2);
const targets = await findPublishablePackages();

console.log(`publishing ${targets.length} packages with args: ${forwardedArgs.join(" ") || "(none)"}`);

for (const { name, dir } of targets) {
  console.log(`\n=== ${name} ===`);
  await $`bun publish ${forwardedArgs}`.cwd(dir);
}
