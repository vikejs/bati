import { describeBati } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3"],
  [
    "authjs",
    ...(process.env.TEST_AUTH0_CLIENT_ID ? (["auth0"] as const) : []),
    ...(process.env.TEST_FIREBASE_ACCOUNT ? (["firebase-auth"] as const) : []),
  ],
  "eslint",
] as const;

await describeBati(({ test, expect, fetch, testMatch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  testMatch<typeof matrix>("auth/signin", {
    authjs: async () => {
      const res = await fetch("/api/auth/signin");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    },
    auth0: async () => {
      const res = await fetch("/api/auth/login", {
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.statusText).toBe("Found");
      expect(res.headers.get("location")).toContain("auth0.com/authorize");
      expect(await res.text()).not.toContain('{"is404":true}');
    },
    "firebase-auth": async () => {
      const res = await fetch("/login");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    },
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).toContain('{"is404":true}');
  });
});
