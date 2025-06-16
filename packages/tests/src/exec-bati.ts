import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bunExists, exec } from "@batijs/tests-utils";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function execLocalBati(context: GlobalContext, flags: string[], monorepo = true) {
  const digest = flags.join("--") || "empty";
  // --skip-git ensures proper turborepo cache computation
  const mappedFlags = ["skip-git", ...flags].map((f) => `--${f}`);

  if (context.localRepository) {
    // local verdaccio server is running.
    // This is better than using the local dist build directly
    // as we are also testing that the generated package dependencies are properly bundled.
    await exec("npm", ["--registry", "http://localhost:4873", "create", "bati@local", "--", ...mappedFlags, digest], {
      timeout: 15000,
      cwd: monorepo ? join(context.tmpdir, "packages") : context.tmpdir,
      env: {
        BATI_TEST: "1",
      },
      stdio: ["ignore", "ignore", "inherit"],
    });
  } else {
    await exec(
      bunExists ? "bun" : "node",
      [...(bunExists ? ["--bun"] : []), join(__dirname, "..", "..", "cli", "dist", "index.js"), ...mappedFlags, digest],
      {
        timeout: 10000,
        cwd: monorepo ? join(context.tmpdir, "packages") : context.tmpdir,
        env: {
          BATI_TEST: "1",
        },
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
  }

  return monorepo ? join(context.tmpdir, "packages", digest) : join(context.tmpdir, digest);
}
