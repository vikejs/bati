import { execa } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";

export async function runBuild(context: GlobalContext) {
  context.server = execa(npmCli, ["run", "build"], {
    timeout: 60000,
    env: {
      NODE_ENV: "production",
    },
  });

  try {
    await Promise.race([
      // wait for process to finish
      context.server,
      // or timeout
      new Promise((_, reject) => {
        setTimeout(reject, 60000);
      }),
    ]);
  } catch (e) {
    console.log("Build didn't finish in time or exited with error code. Current output:");
    console.log(context.server.log);
    throw e;
  }

  return { process: context.server };
}
