import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { AppContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export function runDevServer(context: AppContext) {
  return startServer(context, "dev", {
    VITE_CONFIG: JSON.stringify({ server: { port: context.port, strictPort: true } }),
  });
}

export function runProd(context: AppContext, script?: "preview") {
  // the generated `prod`/`preview` scripts self-build before serving
  return startServer(context, script ?? "prod", { NODE_ENV: "production" });
}

// Start the generated app's server on context.port and resolve once it serves HTTP — or fail fast if
// it stops before the port ever opens.
async function startServer(context: AppContext, script: string, env: Record<string, string>) {
  const cmd = ["run", script, "--port", String(context.port)];
  context.server = exec(npmCli, cmd, { env: { PORT: String(context.port), ...env } });

  const res = await Promise.race([
    waitForLocalhost({ port: context.port, useGet: true, timeout: 30_000, debug: cmd.join(" ") }),
    context.server, // wins only if the server exits/crashes before the port opens
  ]);
  if (!res) throw new Error("Server stopped before tests could run");

  return { server: context.server, port: context.port };
}
