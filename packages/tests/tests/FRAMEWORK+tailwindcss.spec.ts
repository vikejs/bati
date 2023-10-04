import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], "tailwindcss"];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
