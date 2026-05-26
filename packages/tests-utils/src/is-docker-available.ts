import { spawn } from "node:child_process";

let cached: Promise<boolean> | undefined;

/**
 * Resolves `true` when the Docker CLI is installed AND the daemon is reachable.
 *
 * `docker info` exits non-zero when the CLI is missing (spawn "error") or the
 * daemon isn't running (non-zero exit), so it covers both conditions in one go.
 * The result is cached for the lifetime of the process.
 */
export function isDockerAvailable(): Promise<boolean> {
  cached ??= new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn("docker", ["info"], { stdio: "ignore" });
    } catch {
      done(false);
      return;
    }

    const timer = setTimeout(() => {
      child.kill();
      done(false);
    }, 10_000);

    child.on("error", () => {
      clearTimeout(timer);
      done(false);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      done(code === 0);
    });
  });

  return cached;
}
