import { describeBati } from "@batijs/tests-utils";

// export const matrix = [["solid", "react", "vue"], ["express", "hattip", "h3"], "trpc", "eslint"];
export const matrix = [["solid", "react", "vue"], ["express"], "trpc", "eslint"];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("/api/trpc/demo", async () => {
    const res = await fetch("/api/trpc/demo");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: { data: { demo: true } } });
  });
});
