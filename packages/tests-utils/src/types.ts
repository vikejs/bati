import type { ExecaChildProcess as ExecaChildProcessOrig } from "execa";
import type { RequestInit, Response } from "node-fetch";

export interface GlobalContext {
  port: number;
  server: ExecaChildProcess<string> | undefined;
  flags: string[];
}

export interface PrepareOptions {
  mode?: "dev" | "build" | "none";
}

export type ExecaChildProcess<T extends string> = ExecaChildProcessOrig<T> & {
  // Will be fed in real time with stdout and stderr, with timestamps.
  log: string;

  // Kill the process and all its children.
  treekill(): Promise<void>;

  // True if the process was killed by `treekill()`. Useful because on Windows the `killed` and `signal` properties
  // aren't reliably set when killing the process. Probably related to https://github.com/sindresorhus/execa/issues/52
  treekilled: boolean;
};

type Fetch = (path: string, init?: RequestInit) => Promise<Response>;

export type TestContext = typeof import("vitest") & { fetch: Fetch; context: GlobalContext };
