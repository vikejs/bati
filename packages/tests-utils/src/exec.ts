import { type ChildProcess, type SpawnOptions, spawn } from "node:child_process";
import { kill } from "zx";

interface ExecuteCommandOptions extends SpawnOptions {
  timeout?: number; // Timeout in milliseconds
}

// A child handle that can replay its captured output on demand — for a server whose teardown kill
// isn't a failure, so its logs are surfaced only when a test fails (see fixtures.ts).
export type ExecHandle = Promise<void> & ChildProcess & { flushOutput: () => void };

export function exec(command: string, args: string[], options: ExecuteCommandOptions = {}): ExecHandle {
  const { timeout, ...spawnOptions } = options;
  const child = spawn(command, args, {
    // Capture by default so a clean run is silent; output is replayed only on a genuine failure, or
    // when a caller flushes a server's logs on test failure. Callers may override `stdio`.
    stdio: ["ignore", "pipe", "pipe"],
    ...spawnOptions,
    env: { ...cleanEnv(), ...spawnOptions.env },
  });

  const flushOutput = captureOutput(child);
  killChildWithParent(child);

  const debug = `${command} ${args.join(" ")} (cwd: ${spawnOptions.cwd})`;
  const promise = new Promise<void>((resolve, reject) => {
    const timer = timeout
      ? setTimeout(() => {
          flushOutput();
          kill(child.pid!);
          reject(new Error(`Process timed out after ${timeout}ms: ${debug}`));
        }, timeout)
      : undefined;

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) return resolve();
      if (!wasKilled(code, signal)) flushOutput(); // a deliberate kill is not a failure
      reject(new Error(`Process exited with code ${code}: ${debug}`));
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      flushOutput();
      reject(err);
    });
  });

  return Object.assign(promise, child, { flushOutput });
}

// Don't leak the test runner's own env into spawned tools / generated apps.
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.NODE_ENV;
  delete env.TEST;
  delete env.VITEST;
  delete env.VITEST_MODE;
  return env;
}

const OUTPUT_CAP = 256 * 1024; // keep only the tail of a chatty / long-running process

// Buffer recent stdout+stderr; return a one-shot replay of it to stderr.
function captureOutput(child: ChildProcess): () => void {
  const chunks: Buffer[] = [];
  let bytes = 0;
  const keep = (chunk: Buffer) => {
    chunks.push(chunk);
    bytes += chunk.length;
    while (bytes > OUTPUT_CAP && chunks.length > 1) bytes -= chunks.shift()!.length;
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);

  let flushed = false;
  return () => {
    if (flushed || chunks.length === 0) return;
    flushed = true;
    process.stderr.write(Buffer.concat(chunks));
  };
}

// A killed server exits by signal — or, when it traps SIGTERM as bun does, as code 128+signal
// (143=SIGTERM, 137=SIGKILL). None of these is a real failure.
function wasKilled(code: number | null, signal: NodeJS.Signals | null): boolean {
  return signal === "SIGTERM" || signal === "SIGKILL" || code === 143 || code === 137;
}

// Kill the child if the parent goes down, so a crashing run doesn't orphan servers.
function killChildWithParent(child: ChildProcess) {
  const cleanup = async () => {
    if (!child.killed) await kill(child.pid!);
  };
  process.on("exit", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("uncaughtException", cleanup);

  child.on("exit", () => {
    process.off("exit", cleanup);
    process.off("SIGTERM", cleanup);
    process.off("SIGINT", cleanup);
    process.off("uncaughtException", cleanup);
  });
}
