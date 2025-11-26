import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext, PrepareOptions } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runProd(context: GlobalContext, script?: PrepareOptions["script"]) {
  if (context.flags.includes("--cloudflare")) script ??= "preview";
  const cmd = ["run", script ?? "prod", "--port", String(context.port)];
  context.server = exec(npmCli, cmd, {
    env: {
      PORT: String(context.port),
      NODE_ENV: "production",
    },
  });

  const res = await Promise.race([
    // wait for port
    waitForLocalhost({
      port: context.port,
      useGet: true,
      timeout: process.env.CI ? 30000 : 15000,
      debug: cmd.join(" "),
    }),
    // or for server to crash
    context.server,
  ]);

  if (!res) {
    throw new Error("Server stopped before tests could run");
  }

  return { server: context.server, port: context.port };
}
