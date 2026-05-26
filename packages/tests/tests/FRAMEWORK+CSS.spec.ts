import { readFile } from "node:fs/promises";
import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

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
