import nodeFetch, { type RequestInit } from "node-fetch";
import { kill } from "zx";
import { initPort } from "./port.js";
import { runBuild } from "./run-build.js";
import { runDevServer } from "./run-dev.js";
import type { GlobalContext, PrepareOptions } from "./types.js";
import { readFile } from "node:fs/promises";

async function retryX<T>(task: () => T | Promise<T>, retriesLeft?: number) {
  let error: unknown = undefined;
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

export async function prepare({ mode = "dev", retry }: PrepareOptions = {}) {
  const { beforeAll, afterAll } = await import("vitest");

  const bati = JSON.parse(await readFile("bati.config.json", "utf-8"));

  const context: GlobalContext = {
    port: 0,
    port_1: 0,
    server: undefined,
    flags: bati.flags,
  };

  beforeAll(async () => {
    if (mode === "dev") {
      await initPort(context);
      await runDevServer(context);
    } else if (mode === "build") {
      await retryX(() => runBuild(context), retry);
    }
  }, 120000);

  // Cleanup tests:
  // - Close the dev server
  // - Remove temp dir
  afterAll(async () => {
    const pid = context.server?.pid;
    await Promise.race([...(pid ? [kill(pid)] : []), new Promise((_resolve, reject) => setTimeout(reject, 5000))]);
  }, 20000);

  return {
    fetch(path: string, init?: RequestInit) {
      const url = path.startsWith("http") ? path : `http://localhost:${context.port}${path}`;
      return nodeFetch(url, init);
    },
    context,
  };
}
