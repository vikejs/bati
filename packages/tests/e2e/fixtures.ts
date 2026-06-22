import {
  exec,
  type GlobalContext,
  initPort,
  npmCli,
  runDevServer,
  runDockerCompose,
  runProd,
  stopDockerCompose,
  zx,
} from "@batijs/tests-utils";
import { afterAll, beforeAll, expect, inject, test as base } from "vitest";
import type { Mode } from "./matrix.js";

export const flags = inject("flags");
export const appDir = inject("appDir");
export const mode = inject("mode");
export const smoke = inject("smoke");

// The built/containerized mode a combo is re-run in after its primary (dev) pass.
export const smokeMode: Mode = flags.includes("dokploy") ? "docker" : flags.includes("cloudflare") ? "preview" : "prod";

export const runScript = (...args: string[]) => exec(npmCli, ["run", ...args], { cwd: appDir, timeout: 120_000 });

const ctx: GlobalContext = { port: 0, port_1: 0, server: undefined, flags };

export const appUrl = () => `http://localhost:${ctx.port}`;

type Fetch = (path: string, init?: RequestInit) => Promise<Response>;

export const test = base.extend<{ fetch: Fetch }>({
  fetch: ({}, use) => use((path, init) => fetch(path.startsWith("http") ? path : `${appUrl()}${path}`, init)),
});

export async function expectHome(fetch: Fetch) {
  const res = await fetch("/");
  expect(res.status).toBe(200);
  expect(await res.text()).not.toContain('{"is404":true}');
}

export function useApp() {
  useAppFor(mode);
}

export function useAppFor(m: Mode) {
  beforeAll(() => bootApp(m), 600_000);
  afterAll(() => teardown(m), m === "docker" ? 60_000 : 30_000);
}

async function bootApp(m: Mode) {
  process.chdir(appDir); // race-free: each project×file runs in its own forked worker
  if (m === "none") return; // file-only assertions, no server
  await initPort(ctx);
  if (m === "dev") await runDevServer(ctx);
  else if (m === "prod") await runProd(ctx); // the generated `prod` script self-builds
  else if (m === "preview") await runProd(ctx, "preview");
  else if (m === "docker") await runDockerCompose(ctx);
  else m satisfies never;
}

async function teardown(m: Mode) {
  if (m === "docker") await stopDockerCompose();
  else if (ctx.server?.pid) await zx.kill(ctx.server.pid);
}
