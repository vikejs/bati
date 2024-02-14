import type { ExecaChildProcess as ExecaChildProcessOrig } from "execa";
import type { RequestInit, Response } from "node-fetch";
import type { TestOptions } from "vitest";

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

export type FlagMatrix = ReadonlyArray<string | ReadonlyArray<string | null | undefined>>;

export type FlagsFromMatrix<T extends FlagMatrix> = Exclude<FlatArray<T, 1>, undefined>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestMatchFunction = () => Promise<any> | void;

export type TestMatches<T extends FlagMatrix> = {
  [P in (FlagsFromMatrix<T> & string) | "_"]?: TestMatches<T> | TestMatchFunction;
};

export type TestContext = typeof import("vitest") & {
  fetch: Fetch;
  context: GlobalContext;
  testMatch: <T extends FlagMatrix>(
    name: string,
    matches: TestMatches<T>,
    options?: number | TestOptions,
  ) => Promise<unknown> | void;
};
