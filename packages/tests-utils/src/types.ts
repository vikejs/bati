import type { ChildProcess } from "child_process";
import type { RequestInit, Response } from "node-fetch";
import type { TestOptions } from "vitest";

export interface GlobalContext {
  port: number;
  port_1: number;
  server: (Promise<void> & ChildProcess) | undefined;
  flags: string[];
}

export interface PrepareOptions {
  mode?: "dev" | "build" | "none";
}

type Fetch = (path: string, init?: RequestInit) => Promise<Response>;

export type FlagMatrix = ReadonlyArray<string | ReadonlyArray<string | null | undefined>>;

export type FlagsFromMatrix<T extends FlagMatrix> = Exclude<FlatArray<T, 1>, undefined>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestMatchFunction = () => Promise<any> | void;

export type TestMatch = TestMatchFunction | [TestMatchFunction, TestOptions];

export type TestMatches<T extends FlagMatrix> = {
  [P in (FlagsFromMatrix<T> & string) | "_"]?: TestMatches<T> | TestMatch;
};

export type TestContext = typeof import("vitest") & {
  fetch: Fetch;
  context: GlobalContext;
  testMatch: <T extends FlagMatrix>(name: string, matches: TestMatches<T>) => Promise<unknown> | void;
};
