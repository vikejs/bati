import type { TestOptions } from "vitest";
import { prepare } from "./prepare.js";
import type {
  FlagMatrix,
  GlobalContext,
  PrepareOptions,
  TestContext,
  TestMatches,
  TestMatchFunction,
} from "./types.js";

function* yieldMatchValue<T extends FlagMatrix>(
  fnOrMatch: TestMatchFunction | TestMatches<T>,
  flags: string[],
): Generator<TestMatchFunction> {
  if (typeof fnOrMatch === "function") {
    yield fnOrMatch;
    return;
  }
  yield* yieldMatch(fnOrMatch, flags);
}

function* yieldMatch<T extends FlagMatrix>(matches: TestMatches<T>, flags: string[]) {
  for (const [key, value] of Object.entries(matches)) {
    if (flags.includes(key) || key === "_") {
      yield* yieldMatchValue(value as TestMatchFunction | TestMatches<T>, flags);
      return;
    }
  }
}

function testMatchFactory(vitest: typeof import("vitest"), context: GlobalContext) {
  return function testMatch<T extends FlagMatrix>(
    name: string,
    matches: TestMatches<T>,
    options?: number | TestOptions,
  ) {
    for (const fn of yieldMatch(matches, context.flags)) {
      vitest.test(name, fn, options);
    }
  };
}

export async function describeBati(fn: (props: TestContext) => void, options?: PrepareOptions) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");
  const p = await prepare(options);
  const testMatch = testMatchFactory(vitest, p.context);

  vitest.describe.concurrent("TEST", () => {
    fn({
      ...vitest,
      ...p,
      testMatch,
    } as unknown as TestContext);
  });
}
