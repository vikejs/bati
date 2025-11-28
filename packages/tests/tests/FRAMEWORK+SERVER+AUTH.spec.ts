import { describeBati, describeMultipleBati } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify"],
  ["authjs", ...(process.env.TEST_AUTH0_CLIENT_ID ? (["auth0"] as const) : [])],
  ["cloudflare", undefined],
  "eslint",
  "biome",
  "oxlint",
] as const;

export const exclude = [
  // Restrict cloudflare tests to react + compatible servers
  ["solid", "cloudflare"],
  ["vue", "cloudflare"],
  ["authjs", "cloudflare"],
  ["fastify", "cloudflare"],
  ["express", "cloudflare"],
];

// How to configure your environment for testing auth?
// First, create a .env.test file at the root of bati workspace
//
// For auth0, you must put your client ID and Issuer base URL in .env.test like so
// TEST_AUTH0_CLIENT_ID=...
// TEST_AUTH0_ISSUER_BASE_URL=https://<...>.auth0.com

await describeMultipleBati([
  () =>
    describeBati(({ test, expect, fetch }) => {
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
        expect(res.status).toBe(404);
      });
    }),
  // preview
  () =>
    describeBati(
      ({ test, expect, fetch }) => {
        test("home", async () => {
          const res = await fetch("/");
          expect(res.status).toBe(200);
          expect(await res.text()).not.toContain('{"is404":true}');
        });
      },
      {
        mode: "prod",
      },
    ),
]);
