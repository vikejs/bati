import { execa, type ExecaChildProcess } from "execa";
import { afterAll, beforeAll } from "vitest";
import nodeFetch from "node-fetch";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "fs/promises";
import { join } from "node:path";
import http from "node:http";
import getPort from "get-port";
import treeKill from "tree-kill";
import * as process from "process";

interface GlobalContext {
  tmpdir: string;
  port: number;
  server: ExecaChildProcess<string> | undefined;
}

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
        },
        (response) => {
          if (response.statusCode === 200) {
            resolve({ ipVersion });
            return;
          }

          next();
        }
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

async function initTmpDir(context: GlobalContext) {
  context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
}

function execCli(context: GlobalContext, flags: string[]) {
  return execa("node", ["./dist/index.js", ...flags.map((f) => `--${f}`), context.tmpdir]);
}

function runPnpmInstall(context: GlobalContext) {
  return execa("pnpm", ["install"], {
    cwd: context.tmpdir,
  });
}

async function initPort(context: GlobalContext) {
  context.port = await getPort();
}

async function runDevServer(context: GlobalContext) {
  context.server = execa("pnpm", ["run", "dev", "--port", String(context.port)], {
    cwd: context.tmpdir,
    env: {
      PORT: String(context.port),
    },
  });

  await Promise.race([
    // wait for port
    waitForLocalhost({ port: context.port, useGet: true, timeout: 27000 }),
    // or for server to crash
    context.server,
  ]);

  return { server: context.server, port: context.port };
}

export function prepare(flags: string[]) {
  const context: GlobalContext = {
    tmpdir: "",
    port: 0,
    server: undefined,
  };

  beforeAll(async () => {
    await initTmpDir(context);
    await execCli(context, flags);
    await Promise.all([runPnpmInstall(context), initPort(context)]);
    await runDevServer(context);
  }, 30000);

  afterAll(async () => {
    // Unfortunately on Linux `context.server?.kill()` will kill the `pnpm`
    // process but not its children, so the dev server will keep running,
    // leading to the recursive rm later to fail. See also
    // https://github.com/sindresorhus/execa/pull/170#issuecomment-504143618
    // This is also happening when running `pnpm run dev` manually in a shell:
    // stopping it with Ctrl+C will kill the child dev server, but sending a
    // SIGINT/SIGTERM manually won't. To work around this, we kill all the
    // children by using node-tree-kill.
    const pid = context.server?.pid;
    if (pid) {
      await new Promise((resolve) => treeKill(pid, resolve));
    }
    await rm(context.tmpdir, { recursive: true, force: true });
  }, 30000);

  return {
    fetch(path: string, init?: Parameters<typeof fetch>[1]) {
      return nodeFetch(`http://localhost:${context.port}${path}`, init);
    },
  };
}
