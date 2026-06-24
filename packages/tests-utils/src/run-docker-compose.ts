import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { AppContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runDockerCompose(context: AppContext) {
  // Start from a clean volume: a previous run of this combo may have left a postgres volume whose
  // tables collide with the freshly-regenerated migration (drizzle names each migration randomly, so
  // the hash differs, `drizzle-kit migrate` re-applies it, and `CREATE TABLE todos` hits "already
  // exists" — the app then crash-loops and never serves).
  await exec("docker", ["compose", "down", "--volumes", "--remove-orphans"], { timeout: 60_000 }).catch(() => {});

  // `docker compose up -d --build` returns once the image builds and the containers start (detached).
  await exec(npmCli, ["run", "prod"], {
    env: {
      PORT: String(context.port),
    },
    timeout: process.env.CI ? 600_000 : 300_000, // 10 min CI / 5 min local
  });

  // The container serves in the background; wait for its HTTP port to answer. The wait returns the
  // instant the port responds, so the cap only bites on a genuine boot failure.
  await waitForLocalhost({
    port: context.port,
    useGet: true,
    timeout: 60_000,
    debug: `docker waitForLocalhost (port ${context.port})`,
  });

  return { port: context.port };
}

export async function stopDockerCompose() {
  await exec("docker", ["compose", "down", "--volumes", "--remove-orphans"], {
    timeout: 60_000,
  });
}
