import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runDevServer(context: GlobalContext) {
  context.server = exec(npmCli, ["run", "dev", "--port", String(context.port)], {
    env: {
      PORT: String(context.port),
      HMR_PORT: String(context.port_1),
    },
  });

  const res = await Promise.race([
    // wait for port
    waitForLocalhost({ port: context.port, useGet: true, timeout: process.env.CI ? 20000 : 5000 }),
    // or for server to crash
    context.server,
  ]);

  if (!res) {
    throw new Error("Server stopped before tests could run");
  }

  return { server: context.server, port: context.port };
}
