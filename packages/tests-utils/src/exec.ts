import { ChildProcess, spawn, type SpawnOptions } from "child_process";
import { kill } from "zx";

interface ExecuteCommandOptions extends SpawnOptions {
  timeout?: number; // Timeout in milliseconds
}

function setupCleanup(childProcess: ChildProcess) {
  const cleanup = async () => {
    if (childProcess && !childProcess.killed) {
      await kill(childProcess.pid!);
    }
  };

  process.on("exit", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("uncaughtException", cleanup);

  // Cleanup listeners after the child process exits to prevent memory leaks
  childProcess.on("exit", () => {
    process.off("exit", cleanup);
    process.off("SIGTERM", cleanup);
    process.off("SIGINT", cleanup);
    process.off("uncaughtException", cleanup);
  });
}

export function exec(
  command: string,
  args: string[],
  options: ExecuteCommandOptions = {},
): Promise<void> & ChildProcess {
  const { timeout, ...restOptions } = options;

  const childProcess = spawn(command, args, {
    stdio: "inherit",
    ...restOptions,
    env: {
      ...process.env,
      ...restOptions?.env,
    },
  });

  setupCleanup(childProcess);

  const promise = new Promise<void>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (timeout) {
      timeoutId = setTimeout(async () => {
        await kill(childProcess.pid!);
        reject(new Error(`Process timed out after ${timeout}ms`));
      }, timeout);
    }

    childProcess.on("close", (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    childProcess.on("error", (err) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(err);
    });
  });

  return Object.assign(promise, childProcess);
}
