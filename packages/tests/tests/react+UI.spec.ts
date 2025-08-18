import { readFile } from "node:fs/promises";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["react", ["compiled-css", "mantine"], "eslint", "biome"] as const;

await describeBati(({ test, expect, fetch, testMatch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  testMatch<typeof matrix>("ui lib", {
    "compiled-css": async () => {
      const content = await readFile("package.json", "utf-8");
      expect(content.includes("@compiled/react")).toBe(true);
    },
    mantine: async () => {
      const content = await readFile("layouts/LayoutDefault.tsx", "utf-8");
      expect(content.includes("@mantine/core/styles.css")).toBe(true);
    },
  });
});
