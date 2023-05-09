import { execa, type ExecaChildProcess } from "execa";
import { afterAll, beforeAll } from "vitest";
import nodeFetch from "node-fetch";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "fs/promises";
import { join } from "node:path";
import getPort from "get-port";
import waitForLocalhost from "wait-for-localhost";

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
  const server = execa("pnpm", ["run", "dev", "--port", String(port)], {
    cwd: context.tmpdir,
    env: {
      PORT: String(port),
    },
  });

  await waitForLocalhost({ port, useGet: true });

  return { server, port };
}

export function prepare(flags: string[]) {
  let port: number;
  let server: ExecaChildProcess<string> | undefined = undefined;
  const context: GlobalContext = {
    tmpdir: "",
  };

  beforeAll(async () => {
    await initTmpDir(context);
    await execCli(context, flags);
    await runPnpmInstall(context);
    const devServer = await runDevServer(context);
    port = devServer.port;
    server = devServer.server;
  }, 30000);

  afterAll(async () => {
    server?.kill();
    await rm(context.tmpdir, { recursive: true, force: true });
  }, 30000);

  return {
    fetch(path: string, init?: Parameters<typeof fetch>[1]) {
      return nodeFetch(`http://localhost:${port}${path}`, init);
    },
  };
}
