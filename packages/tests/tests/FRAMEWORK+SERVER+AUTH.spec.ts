import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati } from "@batijs/tests-utils";

const testAuth0 = Boolean(process.env.TEST_AUTH0_CLIENT_ID);

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify"],
  ["authjs", ...(testAuth0 ? (["auth0"] as const) : [])],
  ["cloudflare", undefined],
  ["dokploy", undefined],
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
  // cloudflare and dokploy are mutually exclusive
  ["cloudflare", "dokploy"],
  // Restrict dokploy tests to react + hono only (one combination per auth layer)
  ["solid", "dokploy"],
  ["vue", "dokploy"],
  ["express", "dokploy"],
  ["h3", "dokploy"],
  ["fastify", "dokploy"],
];

// How to configure your environment for testing auth?
// First, create a .env.test file at the root of bati workspace
//
// For auth0, you must put your client ID and Issuer base URL in .env.test like so
// TEST_AUTH0_CLIENT_ID=...
// TEST_AUTH0_ISSUER_BASE_URL=https://<...>.auth0.com

await describeMultipleBati([
  () =>
    describeBati(({ test, expect, fetch, context, testMatch }) => {
      test("home", async () => {
        const res = await fetch("/");
        expect(res.status).toBe(200);
        expect(await res.text()).not.toContain('{"is404":true}');
      });

      test("auth/signin", { skip: context.flags.includes("auth0") && !testAuth0 }, async () => {
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

      testMatch<typeof matrix>("has Dockerfile", {
        dokploy: async () => {
          expect(existsSync(path.join(process.cwd(), "Dockerfile"))).toBe(true);
        },
      });

      testMatch<typeof matrix>("has docker-compose.yml", {
        dokploy: async () => {
          expect(existsSync(path.join(process.cwd(), "docker-compose.yml"))).toBe(true);
        },
      });

      testMatch<typeof matrix>("docker-compose.yml references Dockerfile", {
        dokploy: async () => {
          const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
          expect(content).toContain("Dockerfile");
        },
      });

      testMatch<typeof matrix>("docker-compose.yml has AUTH_SECRET when authjs", {
        dokploy: {
          authjs: async () => {
            const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
            expect(content).toContain("AUTH_SECRET");
          },
        },
      });
    }),
  // preview / docker-compose
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
        mode: (ctx) => (ctx.flags.includes("dokploy") ? "docker" : "prod"),
      },
    ),
]);
