import { readFile } from "node:fs/promises";
import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["tailwindcss", "daisyui"], "eslint"];

await describeBati(({ test, expect, fetch, context }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("daiysui", async () => {
    const content = await readFile("tailwind.config.ts", "utf-8");
    expect(content.includes("daisyui")).toBe(context.flags.includes("daisyui"));
  });
});
