import { execa } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runDevServer(context: GlobalContext) {
  context.server = execa(npmCli, ["run", "dev", "--port", String(context.port)], {
    env: {
      PORT: String(context.port),
    },
  });

  try {
    await Promise.race([
      // wait for port
      waitForLocalhost({ port: context.port, useGet: true, timeout: 20000 }),
      // or for server to crash
      context.server,
    ]);
  } catch (e) {
    console.log("Server didn't come up in time. Current output:");
    console.log(context.server.log);
    throw e;
  }

  return { server: context.server, port: context.port };
}
