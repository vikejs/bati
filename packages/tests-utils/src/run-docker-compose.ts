import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runDockerCompose(context: GlobalContext) {
  // docker compose up -d --build exits once containers are started (detached)
  // We run it synchronously (waiting for the build+start to complete),
  // then wait for the container's HTTP port to become accessible.
  await exec(npmCli, ["run", "prod"], {
    env: {
      PORT: String(context.port),
    },
    timeout: process.env.CI ? 600_000 : 300_000, // 10 min CI / 5 min local
  });

  // The container starts in the background; wait for it to accept HTTP connections
  await waitForLocalhost({
    port: context.port,
    useGet: true,
    timeout: process.env.CI ? 60_000 : 30_000,
    debug: `docker compose (port ${context.port})`,
  });

  return { port: context.port };
}

export async function stopDockerCompose() {
  await exec("docker", ["compose", "down", "--remove-orphans"], {
    timeout: 60000,
  });
}
