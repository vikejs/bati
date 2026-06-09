// Iterate publishable workspaces and publish each one via `bun pm pack` +
// `npm publish <tarball>` (preserves OIDC trusted publishing + provenance).

import { packAndPublish } from "./lib/publish.js";
import { loadWorkspaces } from "./lib/workspaces.js";

async function main() {
  const forwardedArgs = process.argv.slice(2);
  const targets = (await loadWorkspaces()).filter(({ name, pkg }) => !pkg.private && name !== "@batijs/elements");

  console.log(`publishing ${targets.length} packages with args: ${forwardedArgs.join(" ") || "(none)"}`);

  for (const { name, dir } of targets) {
    console.log(`\n=== ${name} ===`);
    await packAndPublish(dir, forwardedArgs);
  }
}

await main();
