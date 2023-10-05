import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "@batijs/tests-utils";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function execLocalBati(context: GlobalContext, flags: string[]) {
  const digest = flags.join("--") || "empty";

  await execa("node", [join(__dirname, "..", "..", "cli", "dist", "index.js"), ...flags.map((f) => `--${f}`), digest], {
    timeout: 5000,
    cwd: join(context.tmpdir, "packages"),
  });

  return join(context.tmpdir, "packages", digest);
}
