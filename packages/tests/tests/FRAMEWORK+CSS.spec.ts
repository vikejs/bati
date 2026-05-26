import { readFile } from "node:fs/promises";
import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

// Tests the two original CSS/UI flavours: bare tailwindcss, and tailwindcss
// + daisyui (which is a UI Component Library that requires tailwindcss).
// Spread picks one framework per combo. Was 6 combos; now 2.
//
// Note: the `css` axis derived from features now contains tailwindcss +
// compiled-css. We don't use it here because compiled-css requires React and
// is exercised by react+UI.spec.ts instead.
const tests = suite()
  .case({ framework: spread(framework), flags: "tailwindcss" })
  .case({ framework: spread(framework), flags: ["tailwindcss", "daisyui"] })
  .linters("eslint", "biome", "oxlint");

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeBati(({ test, expect, fetch, testMatch, context }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  testMatch<TestFlags>("config exists", {
    daisyui: async () => {
      const content = await readFile("pages/tailwind.css", "utf-8");
      expect(content.includes("daisyui")).toBe(context.flags.includes("daisyui"));
    },
  });
});
