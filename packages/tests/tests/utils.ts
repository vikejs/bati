import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import stream from "node:stream";
import {
  execa as execaOrig,
  type ExecaChildProcess as ExecaChildProcessOrig,
  type ExecaError,
  type Options,
} from "execa";
import getPort from "get-port";
import nodeFetch, { type RequestInit, type Response } from "node-fetch";
import treeKill from "tree-kill";
import which from "which";

export type ExecaChildProcess<T extends string> = ExecaChildProcessOrig<T> & {
  // Will be fed in real time with stdout and stderr, with timestamps.
  log: string;

  // Kill the process and all its children.
  treekill(): Promise<void>;

  // True if the process was killed by `treekill()`. Useful because on Windows the `killed` and `signal` properties
  // aren't reliably set when killing the process. Probably related to https://github.com/sindresorhus/execa/issues/52
  treekilled: boolean;
};

// Pipe any process output to this stream in order to log it with timestamps.
// See:
// * https://stackoverflow.com/questions/21491567/how-to-implement-a-writable-stream
// * https://blog.logrocket.com/running-commands-with-execa-in-node-js/
class LogStream extends stream.Writable {
  // Pass a reference to the string you want to be fed with the log.
  constructor(logReference: { log: string }) {
    super();
    this.logReference = logReference;
  }

  _write(chunk: string | Buffer, encoding: string, callback: (error?: Error | null) => void) {
    const now = new Date().toISOString();
    const text = chunk.toString().trimEnd();
    const lines = text.split("\n");
    for (const line of lines) {
      this.logReference.log += `[${now}] ${line}\n`;
    }
    callback();
  }

  private logReference: { log: string };
}

// Wrapper around https://github.com/sindresorhus/execa , extended with the following features:
// - Log stdout and stderr with timestamps.
// - Print the log on failure or timeout.
// - Add a member `log` to the returned process, for accessing the entire log at any time, even if the command hasn't
//   finished yet.
// - Add a `treekill()` method to the returned process, with a more reliable implementation as the original `kill()`.
export function execa(file: string, args?: string[], options: Options = {}): ExecaChildProcess<string> {
  const newOptions = {
    ...options,
    all: true, // create a single stream for stdout and stderr
  };

  const childProcess = execaOrig(file, args, newOptions) as ExecaChildProcess<string>;
  childProcess.log = "";
  childProcess.all?.pipe(new LogStream(childProcess));
  childProcess.treekill = treekill;
  childProcess.treekilled = false;
  childProcess.catch(printLogOnFailure);
  return childProcess;

  async function treekill() {
    // Unfortunately on Linux `childProcess.kill()` won't kill all the children of the process. See also
    // https://github.com/sindresorhus/execa/pull/170#issuecomment-504143618 . To work around this, we kill all the
    // children by using node-tree-kill.
    childProcess.treekilled = true;
    const pid = childProcess.pid;
    if (pid) {
      await new Promise((resolve) => treeKill(pid, resolve));
    } else {
      childProcess.kill();
    }
  }

  // Print the logs with timestamps on failure or timeout, but not when the process was killed.
  function printLogOnFailure(e: ExecaError) {
    if (e.timedOut) {
      console.log(`'${e.command}' timed out. Output:`);
      console.log(childProcess.log);
    } else if (e.exitCode && !e.killed && !e.signal && !childProcess.treekilled) {
      console.log(`'${e.command}' failed with ${e.exitCode}. Output:`);
      console.log(childProcess.log);
    }
  }
}

interface GlobalContext {
  tmpdir: string;
  port: number;
  server: ExecaChildProcess<string> | undefined;
}

interface PrepareOptions {
  mode?: "dev" | "build";
}

// side-effect
export const bunExists = which.sync("bun", { nothrow: true }) !== null;
export const npmCli = bunExists ? "bun" : "pnpm";

type Fetch = (path: string, init?: RequestInit) => Promise<Response>;

export type TestContext = typeof import("vitest") & { fetch: Fetch; context: GlobalContext };

// https://github.com/sindresorhus/wait-for-localhost
export default function waitForLocalhost({
  port,
  path,
  useGet,
  timeout,
}: { port?: number; path?: string; useGet?: boolean; timeout?: number } = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const retry = () => {
      if (Number.isInteger(timeout) && startedAt + timeout! < Date.now()) {
        reject(new Error("Timeout"));
      } else {
        setTimeout(main, 200);
      }
    };

    const method = useGet ? "GET" : "HEAD";

    const doRequest = (ipVersion: 4 | 6, next: (...args: unknown[]) => void) => {
      const request = http.request(
        {
          method,
          port,
          path,
          family: ipVersion,
          // https://github.com/vitejs/vite/issues/9520
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          },
          timeout: 1000,
        },
        (response) => {
          if (response.statusCode === 200) {
            resolve({ ipVersion });
            return;
          }

          next();
        },
      );

      request.on("error", next);
      request.end();
    };

    const main = () => {
      doRequest(4, () => doRequest(6, () => retry()));
    };

    main();
  });
}

async function initPort(context: GlobalContext) {
  context.port = await getPort();
}

async function runDevServer(context: GlobalContext) {
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

async function runBuild(context: GlobalContext) {
  context.server = execa(npmCli, ["run", "build"], {
    timeout: 20000,
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
        setTimeout(reject, 20000);
      }),
    ]);
  } catch (e) {
    console.log("Build didn't finish in time or exited with error code. Current output:");
    console.log(context.server.log);
    throw e;
  }

  return { process: context.server };
}

export async function prepare({ mode = "dev" }: PrepareOptions = {}) {
  const { beforeAll, afterAll } = await import("vitest");

  const context: GlobalContext = {
    tmpdir: join(tmpdir(), "bati"),
    port: 0,
    server: undefined,
  };

  beforeAll(async () => {
    if (mode === "dev") {
      await initPort(context);
      await runDevServer(context);
    } else if (mode === "build") {
      await runBuild(context);
    }
  }, 56000);

  // Cleanup tests:
  // - Close the dev server
  // - Remove temp dir
  afterAll(async () => {
    await Promise.race([context.server?.treekill(), new Promise((_resolve, reject) => setTimeout(reject, 5000))]).catch(
      (e) => {
        console.log("Failed to kill server in time. Output:");
        console.log(context.server?.log);
        throw e;
      },
    );
  }, 11000);

  return {
    fetch(path: string, init?: RequestInit) {
      return nodeFetch(`http://localhost:${context.port}${path}`, init);
    },
    context,
  };
}

export async function describeBati(fn: (props: TestContext) => void, options?: PrepareOptions) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");
  const p = await prepare(options);

  vitest.describe.concurrent("TEST", () => {
    fn({
      ...vitest,
      ...p,
    } as unknown as TestContext);
  });
}
