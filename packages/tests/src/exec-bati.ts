import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "@batijs/tests-utils";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function execLocalBati(context: GlobalContext, flags: string[], monorepo = true) {
  const digest = flags.join("--") || "empty";

  await execa("node", [join(__dirname, "..", "..", "cli", "dist", "index.js"), ...flags.map((f) => `--${f}`), digest], {
    timeout: 5000,
    cwd: monorepo ? join(context.tmpdir, "packages") : context.tmpdir,
  });

  return monorepo ? join(context.tmpdir, "packages", digest) : join(context.tmpdir, digest);
}
