import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";

export async function runBuild(context: GlobalContext) {
  context.server = exec(npmCli, ["run", "build"], {
    env: {
      NODE_ENV: "production",
    },
  }).timeout("1m");

  await context.server;

  return { server: context.server };
}
