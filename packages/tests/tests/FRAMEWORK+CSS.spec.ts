import { readFile } from "node:fs/promises";
import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["tailwindcss", "daisyui"], "eslint"];

await describeBati(({ test, expect, fetch, testMatch, context }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  testMatch<typeof matrix>("config exists", {
    daisyui: async () => {
      const content = await readFile("layouts/tailwind.css", "utf-8");
      expect(content.includes("daisyui")).toBe(context.flags.includes("daisyui"));
    },
  });
});
