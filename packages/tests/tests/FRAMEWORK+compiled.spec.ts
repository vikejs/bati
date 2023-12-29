import { readFile } from "node:fs/promises";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["react", "compiled-css", "eslint"];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("compiled", async () => {
    const content = await readFile("package.json", "utf-8");
    expect(content.includes("@compiled/react")).toBe(true);
  });
});
