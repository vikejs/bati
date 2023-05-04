import { execa } from "execa";
import { beforeAll, describe, expect, test } from "vitest";
import nodeFetch from "node-fetch";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "fs/promises";
import { join } from "node:path";
import waitForLocalhost from "wait-for-localhost";

const context = {
  tmpdir: "",
};

let port = 3000;

beforeAll(async () => {
  await execa("pnpm", ["run", "build"]);
  context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
});

function execCli(flags: string[]) {
  return execa("node", ["./dist/index.js", ...flags.map((f) => `--${f}`), context.tmpdir]);
}

function runPnpmInstall() {
  return execa("pnpm", ["install"], {
    cwd: context.tmpdir,
  });
}

async function runDevServer() {
  const _p = ++port;
  const server = execa("pnpm", ["run", "dev"], {
    cwd: context.tmpdir,
    env: {
      PORT: String(_p),
    },
  });

  await waitForLocalhost({ port: _p });

  return { server, port: _p };
}

function prepare(flags: string[]) {
  let port: number;

  beforeAll(async () => {
    await execCli(flags);
    await runPnpmInstall();
    const devServer = await runDevServer();
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

describe.concurrent("basic", () => {
  const { fetch } = prepare(["solid", "express"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    expect(await res.text()).toContain('{"is404":true}');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).toContain('{"is404":true}');
  });
});

describe.concurrent("simple + telefunc", () => {
  const { fetch } = prepare(["solid", "express", "telefunc"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('{"is404":true}');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
