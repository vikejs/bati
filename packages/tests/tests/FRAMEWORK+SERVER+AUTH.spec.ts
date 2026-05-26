import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati, framework, server, suite } from "@batijs/tests-utils";

const testAuth0 = Boolean(process.env.TEST_AUTH0_CLIENT_ID);
const auths = ["authjs", ...(testAuth0 ? (["auth0"] as const) : [])] as const;

const tests = suite()
  .matrix({ framework: framework.values, server: server.values, auth: auths })
  .matrix({ framework: "react", server: ["hono", "h3"], deploy: "cloudflare", auth: "auth0" })
  .matrix({ framework: "react", server: "hono", deploy: "dokploy", auth: auths })
  .linters("eslint", "biome", "oxlint");

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

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

      testMatch<TestFlags>("has Dockerfile", {
        dokploy: async () => {
          expect(existsSync(path.join(process.cwd(), "Dockerfile"))).toBe(true);
        },
      });

      testMatch<TestFlags>("has docker-compose.yml", {
        dokploy: async () => {
          expect(existsSync(path.join(process.cwd(), "docker-compose.yml"))).toBe(true);
        },
      });

      testMatch<TestFlags>("docker-compose.yml references Dockerfile", {
        dokploy: async () => {
          const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
          expect(content).toContain("Dockerfile");
        },
      });

      testMatch<TestFlags>("docker-compose.yml has AUTH0_CLIENT_ID when auth0", {
        dokploy: {
          auth0: async () => {
            const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
            expect(content).toContain("AUTH0_CLIENT_ID");
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
