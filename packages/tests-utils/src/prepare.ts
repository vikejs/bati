import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import nodeFetch, { type RequestInit } from "node-fetch";
import { kill } from "zx";
import { exec } from "./exec.js";
import { isDockerAvailable } from "./is-docker-available.js";
import { isPostgresAvailable } from "./is-postgres-available.js";
import { npmCli } from "./package-manager.js";
import { initPort } from "./port.js";
import { runBuild } from "./run-build.js";
import { runDevServer } from "./run-dev.js";
import { runDockerCompose, stopDockerCompose } from "./run-docker-compose.js";
import { runProd } from "./run-prod.js";
import type { GlobalContext, PrepareOptions } from "./types.js";

async function retryX<T>(task: () => T | Promise<T>, retriesLeft?: number) {
  let error: unknown;
  try {
    return await task();
  } catch (e) {
    error = e;
  }
  if (error) {
    if (typeof retriesLeft !== "number" || retriesLeft <= 0) {
      throw error;
    } else {
      return await retryX(task, retriesLeft - 1);
    }
  }
  throw new Error("Unreachable");
}

export async function prepare({ mode = "dev", retry, script }: PrepareOptions = {}) {
  const { beforeAll, afterAll } = await import("vitest");

  const bati = JSON.parse(await readFile("bati.config.json", "utf-8"));

  const context: GlobalContext = {
    port: 0,
    port_1: 0,
    server: undefined,
    flags: bati.flags,
  };

  if (context.flags.includes("cloudflare")) {
    script ??= "preview";
  }

  if (typeof mode === "function") {
    mode = mode(context);
  }

  // Locally, skip docker-based tests when Docker isn't installed or its daemon
  // isn't running. In CI we keep them strict — CI is expected to provide Docker,
  // and a silent skip there would mask infra regressions.
  let skip = false;
  if (mode === "docker" && !process.env.CI && !(await isDockerAvailable())) {
    skip = true;
    console.warn(
      `[tests-utils] Docker not available — skipping docker test: ${context.flags.join(", ") || "(no flags)"}`,
    );
  }

  // Per-database `DATABASE_URL` default. The e2e runner no longer sets a global one (a global
  // "sqlite.db" leaks into postgres apps and breaks them — `dotenv` won't override an inherited var).
  // Anything already set (shell / .env.test / CI) wins via `??=`.
  if (context.flags.includes("postgres")) {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/app";
    // Skip postgres-backed tests when no PostgreSQL is reachable. CI starts a container before the
    // run (so it's reachable there); locally it's skipped instead of failing. Note: the e2e runner
    // sets CI="true" for nx, so we can't gate this on `process.env.CI` — reachability is the signal.
    if (!skip && !(await isPostgresAvailable())) {
      skip = true;
      console.warn(
        `[tests-utils] PostgreSQL not reachable — skipping postgres test: ${context.flags.join(", ") || "(no flags)"}`,
      );
    }
  } else {
    // SQLite-based apps (and feature combos without a database) use a local file. This is also read
    // by migration scripts that don't load `.env` themselves.
    process.env.DATABASE_URL ??= "sqlite.db";
  }

  function preHooks() {
    beforeAll(() => {
      // When vitest is launched from a host-only `<app>.e2e` workspace
      // (the dokploy layout: bati.config.json + spec files there, app dir
      // pristine), every mode needs to operate against the sibling app —
      // `dev`/`prod`/`build` resolve scripts via the app's package.json,
      // `docker` runs compose from the app's Dockerfile, and spec
      // assertions on `process.cwd()` expect to see the app dir. The chdir
      // is a no-op when we are already in the app dir (non-dokploy layout).
      const here = basename(resolve("."));
      if (here.endsWith(".e2e")) {
        process.chdir(resolve("..", here.slice(0, -".e2e".length)));
      }
    }, 1000);

    // Cleanup tests:
    // - Close the dev server / docker-compose stack
    // - Remove temp dir
    afterAll(
      async () => {
        if (mode === "docker") {
          try {
            await stopDockerCompose();
          } catch {
            // best-effort cleanup — don't fail the test run
          }
        } else {
          const pid = context.server?.pid;
          if (typeof pid === "number") {
            await Promise.race([kill(pid), new Promise((_resolve, reject) => setTimeout(reject, 5000))]);
          }
        }
      },
      mode === "docker" ? 60_000 : 30_000,
    );
  }

  function postHooks() {
    beforeAll(
      async () => {
        if (mode === "dev") {
          await initPort(context);
          await runDevServer(context);
        } else if (mode === "prod") {
          await initPort(context);
          await runProd(context, script);
        } else if (mode === "docker") {
          await initPort(context);
          await runDockerCompose(context);
        } else if (mode === "build") {
          await retryX(() => runBuild(context), retry);
        }
      },
      mode === "docker" ? 900_000 : 600_000,
    );
  }

  return {
    fetch(path: string, init?: RequestInit) {
      const url = path.startsWith("http") ? path : `http://localhost:${context.port}${path}`;
      return nodeFetch(url, init);
    },
    exec,
    npmCli,
    context,
    skip,
    preHooks,
    postHooks,
  };
}
