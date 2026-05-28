// Iterate publishable workspaces and invoke `bun publish` per package.
// `bun --filter` doesn't apply to the `publish` subcommand, so we drive it manually.

import { $ } from "bun";
import { loadWorkspaces } from "./lib/workspaces.ts";

async function main() {
  const forwardedArgs = process.argv.slice(2);
  const targets = (await loadWorkspaces()).filter(({ name, pkg }) => !pkg.private && name !== "@batijs/elements");

  console.log(`publishing ${targets.length} packages with args: ${forwardedArgs.join(" ") || "(none)"}`);

  for (const { name, dir } of targets) {
    console.log(`\n=== ${name} ===`);
    await $`bun publish ${forwardedArgs}`.cwd(dir);
  }
}

await main();
