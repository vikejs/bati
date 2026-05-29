import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bunExists, exec } from "@batijs/tests-utils";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function execLocalBati(context: GlobalContext, flags: string[], monorepo = true) {
  const digest = flags.join("--") || "empty";
  const timeout = flags.includes("storybook") ? 120_000 : 30_000;
  // --skip-git prevents git init in generated projects
  // --knip generates knip.json for E2E tests
  const mappedFlags = ["skip-git", "knip", ...flags].map((f) => `--${f}`);

  await exec(
    bunExists ? "bun" : "node",
    [...(bunExists ? ["--bun"] : []), join(__dirname, "..", "..", "cli", "dist", "index.js"), ...mappedFlags, digest],
    {
      timeout,
      cwd: monorepo ? join(context.tmpdir, "packages") : context.tmpdir,
      env: {
        BATI_TEST: "1",
      },
      stdio: ["ignore", "ignore", "inherit"],
    },
  );

  return monorepo ? join(context.tmpdir, "packages", digest) : join(context.tmpdir, digest);
}
