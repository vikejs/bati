import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";

export async function runBuild(context: GlobalContext) {
  context.server = exec(npmCli, ["run", "build"], {
    timeout: 60 * 1000, // 1min
    env: {
      NODE_ENV: "production",
    },
  });

  await context.server;

  return { server: context.server };
}
