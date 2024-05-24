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

export const exclude = [
  ["hono", "auth0"],
  ["hattip", "auth0"],
];

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

await describeBati(({ test, expect, fetch, testMatch, context }) => {
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

  if (context.flags.includes("firebase-auth")) {
    const firebaseClientConfig = process.env.TEST_FIREBASE_CLIENT_CONFIG
      ? JSON.parse(process.env.TEST_FIREBASE_CLIENT_CONFIG)
      : undefined;

    test("sessionLogin 401", async () => {
      const res = await fetch("/api/sessionLogin", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });

    test("sessionLogin", async () => {
      if (!firebaseClientConfig?.apiKey || !process.env.TEST_FIREBASE_USER_UID) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { firebaseAdmin, getAuth } = await import("./libs/firebaseAdmin.js");
      const auth = getAuth(firebaseAdmin);
      const customToken = await auth.createCustomToken(firebaseClientConfig.apiKey);
      const data = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.TEST_FIREBASE_USER_UID}`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: customToken,
            returnSecureToken: true,
          }),
        },
      ).then((x) => x.json() as Promise<{ idToken: string }>);
      const res = await fetch("/api/sessionLogin", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: data.idToken,
        }),
      });
      expect(await res.text()).toContain('{"status":"success"}');
      expect(res.status).toBe(200);
    });

    test("sessionLogout", async () => {
      const res = await fetch("/api/sessionLogout", {
        method: "post",
      });
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });
  }

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).toContain('{"is404":true}');
  });
});
