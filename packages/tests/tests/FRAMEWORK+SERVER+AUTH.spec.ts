import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  describeBati,
  describeMultipleBati,
  exec,
  framework,
  npmCli,
  server,
  spread,
  suite,
} from "@batijs/tests-utils";

const testAuth0 = Boolean(process.env.TEST_AUTH0_CLIENT_ID);
const auths = ["authjs", ...(testAuth0 ? (["auth0"] as const) : [])] as const;

const tests = suite()
  .matrix({ framework: framework.values, server: server.values, auth: auths })
  .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "auth0" })
  .matrix({ framework: "react", server: "hono", deploy: "dokploy", auth: auths })
  // Better Auth requires a database. Cover each UI framework against the SQLite engine with Drizzle,
  // Prisma, Kysely, and raw, balanced across servers via spread().
  .matrix({
    framework: framework.values,
    server: spread(server),
    auth: "better-auth",
    db: "sqlite",
    orm: ["drizzle", "prisma", "kysely", null],
  })
  // PostgreSQL engine (raw + Drizzle + Kysely). Needs a PostgreSQL server at the default DATABASE_URL (CI provides it).
  .matrix({
    framework: "solid",
    server: spread(server),
    auth: "better-auth",
    db: "postgres",
    orm: ["drizzle", "kysely", null],
  })
  // Cloudflare D1 (SQLite on Workers), reached through Kysely's D1 dialect; tables created via wrangler migrations.
  .matrix({
    framework: "react",
    server: "hono",
    deploy: "cloudflare",
    auth: "better-auth",
    db: "sqlite",
    orm: ["drizzle", null],
  })
  .linters("eslint", "biome", "oxlint");

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

// How to configure your environment for testing auth?
// First, create a .env.test file at the root of bati workspace
//
// For auth0, you must put your client ID and Issuer base URL in .env.test like so
// TEST_AUTH0_CLIENT_ID=...
// TEST_AUTH0_ISSUER_BASE_URL=https://<...>.auth0.com
//
// Better Auth runs fully self-contained (email/password) and needs no extra configuration.

await describeMultipleBati([
  () =>
    describeBati(({ test, expect, fetch, context, testMatch, beforeAll }) => {
      beforeAll(async () => {
        // Better Auth manages its own tables. Create them before the server starts.
        if (context.flags.includes("better-auth")) {
          if (context.flags.includes("cloudflare")) {
            await exec(npmCli, ["run", "d1:migrate"]);
          } else {
            await exec(npmCli, ["run", "better-auth:migrate"]);
          }
        }
      }, 70000);

      test("home", async () => {
        const res = await fetch("/");
        expect(res.status).toBe(200);
        expect(await res.text()).not.toContain('{"is404":true}');
      });

      // Auth.js / Auth0 expose a built-in signin page; Better Auth does not (it ships its own pages).
      test("auth/signin", {
        skip: context.flags.includes("better-auth") || (context.flags.includes("auth0") && !testAuth0),
      }, async () => {
        const res = await fetch("/api/auth/signin");
        expect(res.status).toBe(200);
        expect(await res.text()).not.toContain('{"is404":true}');
      });

      testMatch<TestFlags>("better-auth pages", {
        "better-auth": async () => {
          for (const route of ["/login", "/signup", "/account"]) {
            const res = await fetch(route);
            // `/account` redirects unauthenticated visitors to `/login` (followed by fetch).
            expect(res.status).toBe(200);
            expect(await res.text()).not.toContain('{"is404":true}');
          }
        },
      });

      testMatch<TestFlags>("better-auth email/password flow", {
        "better-auth": async () => {
          const email = `e2e_${Date.now()}@example.com`;
          const password = "Password123!";
          // Better Auth validates the request Origin against its base URL; mirror the server host.
          const headers = {
            "content-type": "application/json",
            origin: `http://localhost:${context.port}`,
          };

          const signup = await fetch("/api/auth/sign-up/email", {
            method: "POST",
            headers,
            body: JSON.stringify({ name: "E2E User", email, password }),
          });
          expect(signup.status).toBe(200);

          const signin = await fetch("/api/auth/sign-in/email", {
            method: "POST",
            headers,
            body: JSON.stringify({ email, password }),
          });
          expect(signin.status).toBe(200);

          // A wrong password must be rejected (proves credentials are verified against the database).
          const wrong = await fetch("/api/auth/sign-in/email", {
            method: "POST",
            headers,
            body: JSON.stringify({ email, password: "wrong-password" }),
          });
          expect(wrong.status).toBe(401);
        },
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
