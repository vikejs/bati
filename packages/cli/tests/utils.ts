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
  port: number;
  server: ExecaChildProcess<string> | undefined;
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
    waitForLocalhost({ port: context.port, useGet: true }),
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
    context.server?.kill();
    await rm(context.tmpdir, { recursive: true, force: true });
  }, 30000);

  return {
    fetch(path: string, init?: Parameters<typeof fetch>[1]) {
      return nodeFetch(`http://localhost:${context.port}${path}`, init);
    },
  };
}
