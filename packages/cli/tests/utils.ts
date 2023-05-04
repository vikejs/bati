import { execa } from "execa";
import { beforeAll } from "vitest";
import nodeFetch from "node-fetch";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "fs/promises";
import { join } from "node:path";
import waitForLocalhost from "wait-for-localhost";
import getPort from "get-port";

interface GlobalContext {
  tmpdir: string;
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

async function runDevServer(context: GlobalContext) {
  const port = await getPort();
  const server = execa("pnpm", ["run", "dev"], {
    cwd: context.tmpdir,
    env: {
      PORT: String(port),
    },
  });

  await waitForLocalhost({ port });

  return { server, port };
}

export function prepare(flags: string[]) {
  let port: number;
  const context: GlobalContext = {
    tmpdir: "",
  };

  beforeAll(async () => {
    await initTmpDir(context);
    await execCli(context, flags);
    await runPnpmInstall(context);
    const devServer = await runDevServer(context);
    port = devServer.port;

    return async () => {
      devServer.server.kill();
      await rm(context.tmpdir, { recursive: true, force: true });
    };
  }, 50000);

  return {
    fetch(path: string, init?: Parameters<typeof fetch>[1]) {
      return nodeFetch(`http://localhost:${port}${path}`, init);
    },
  };
}
