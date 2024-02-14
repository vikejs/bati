import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["express", "h3"], "authjs", "eslint"];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).toContain('{"is404":true}');
  });
});
