// Publishes @batijs/elements (website/) via the shared pack+publish helper.
// Split from scripts/publish.ts because the widget has its own bumpp + build
// lifecycle and runs from a different workflow.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packAndPublish } from "./lib/publish.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await packAndPublish(resolve(repoRoot, "website"), process.argv.slice(2));
