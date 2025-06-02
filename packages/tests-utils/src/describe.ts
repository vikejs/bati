import type { TestOptions } from "vitest";
import { prepare } from "./prepare.js";
import type { FlagMatrix, GlobalContext, PrepareOptions, TestContext, TestMatch, TestMatches } from "./types.js";

const isWin = process.platform === "win32";

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

export async function describeBati(fn: (props: TestContext) => void, options?: PrepareOptions) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");
  const p = await prepare(options);
  const testMatch = testMatchFactory(vitest, p.context);

  vitest.describe.concurrent(p.context.flags.map((f) => `--${f}`).join(" "), { retry: options?.retry }, () => {
    fn({
      ...vitest,
      ...p,
      testMatch,
    } as unknown as TestContext);
  });

  if (isWin) {
    vitest.afterAll(async () => {
      process.exit(0);
    });
  }
}
