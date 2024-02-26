import { describeBati } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3"],
  process.env.FIREBASE_TEST ? ["authjs", "firebase-auth"] : ["authjs"],
  "eslint",
];

await describeBati(({ test, expect, fetch, context }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const url = context.flags.includes("firebase-auth") ? "/login" : "/api/auth/signin";
    const res = await fetch(url);
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
