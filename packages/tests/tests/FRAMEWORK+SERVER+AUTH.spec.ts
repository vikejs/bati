import { describeBati } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  [
    "authjs",
    ...(process.env.TEST_AUTH0_CLIENT_ID ? (["auth0"] as const) : []),
    ...(process.env.TEST_FIREBASE_ACCOUNT ? (["firebase-auth"] as const) : []),
  ],
  "eslint",
] as const;

export const exclude = [["hono", "auth0"]];

// How to configure your environment for testing auth?
// First, create a .env.test file at the root of bati workspace
// Then, for firebase, generate a service account json file, and put in .env.test like so
// TEST_FIREBASE_ACCOUNT=`{
//   ...
// }`
//
// For auth0, you must put your client ID and Issuer base URL in .env.test like so
// TEST_AUTH0_CLIENT_ID=...
// TEST_AUTH0_ISSUER_BASE_URL=https://<...>.auth0.com

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
