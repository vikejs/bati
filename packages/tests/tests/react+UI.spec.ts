import { readFile } from "node:fs/promises";
import { describeBati, suite } from "@batijs/tests-utils";

const tests = suite()
  .matrix({ framework: "react", ui: ["compiled-css", "mantine"] })
  .linters("eslint", "biome");

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeBati(({ test, expect, fetch, testMatch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  testMatch<TestFlags>("ui lib", {
    "compiled-css": async () => {
      const content = await readFile("package.json", "utf-8");
      expect(content.includes("@compiled/react")).toBe(true);
    },
    mantine: async () => {
      const content = await readFile("pages/+Layout.tsx", "utf-8");
      expect(content.includes("@mantine/core/styles.css")).toBe(true);
    },
  });
});
