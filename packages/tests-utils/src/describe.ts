import { prepare } from "./prepare.js";
import type { PrepareOptions, TestContext } from "./types.js";

export async function describeBati(fn: (props: TestContext) => void, options?: PrepareOptions) {
  if (process.env.NODE_ENV !== "test") return;

  const vitest = await import("vitest");
  const p = await prepare(options);

  vitest.describe.concurrent("TEST", () => {
    fn({
      ...vitest,
      ...p,
    } as unknown as TestContext);
  });
}
