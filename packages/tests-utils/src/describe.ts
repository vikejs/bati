import type { TestOptions, SuiteFactory } from "vitest";
import { prepare } from "./prepare.js";
import type { FlagMatrix, GlobalContext, PrepareOptions, TestContext, TestMatch, TestMatches } from "./types.js";

function* yieldMatchValue<T extends FlagMatrix>(
  fnOrMatch: TestMatch | TestMatches<T>,
  flags: string[],
): Generator<TestMatch> {
  if (typeof fnOrMatch === "function" || Array.isArray(fnOrMatch)) {
    yield fnOrMatch;
    return;
  }
  yield* yieldMatch(fnOrMatch, flags);
}

function* yieldMatch<T extends FlagMatrix>(matches: TestMatches<T>, flags: string[]) {
  for (const [key, value] of Object.entries(matches)) {
    if (flags.includes(key) || key === "_") {
      yield* yieldMatchValue(value as TestMatch | TestMatches<T>, flags);
      return;
    }
  }
}

function extractFnAndOptions(match: TestMatch) {
  if (Array.isArray(match)) {
    return match;
  }
  return [match, {} as TestOptions] as const;
}

function testMatchFactory(vitest: typeof import("vitest"), context: GlobalContext) {
  return function testMatch<T extends FlagMatrix>(name: string, matches: TestMatches<T>) {
    for (const match of yieldMatch(matches, context.flags)) {
      const [fn, options] = extractFnAndOptions(match);
      vitest.test(name, options, fn);
    }
  };
}

export async function describeMultipleBati(fns: (() => Promise<unknown>)[]) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");

  vitest.describe.sequential("Setup multiple Bati tests", async () => {
    let i = 0;
    for (const fn of fns) {
      vitest.describe(`Setup ${++i}`, {}, fn as SuiteFactory);
    }
  });
}

export async function describeBati(fn: (props: TestContext) => void, options?: PrepareOptions) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");
  const p = await prepare(options);
  const testMatch = testMatchFactory(vitest, p.context);

  const name = p.context.flags.map((f) => `--${f}`).join(" ");

  vitest.describe.concurrent(name, { retry: options?.retry }, () => {
    p.hooks();

    fn({
      ...vitest,
      ...p,
      testMatch,
    } as unknown as TestContext);
  });
}
