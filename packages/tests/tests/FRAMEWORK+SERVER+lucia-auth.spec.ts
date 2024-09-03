import { describeBati, exec, npmCli } from "@batijs/tests-utils";
import { existsSync } from "node:fs";
import path from "node:path";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  "lucia-auth",
  ["drizzle", "sqlite"],
  ["cloudflare", undefined],
  "eslint",
] as const;

export const exclude = [
  // Testing databases with React only is enough
  ["solid", "drizzle"],
  ["vue", "drizzle"],
  ["solid", "sqlite"],
  ["vue", "sqlite"],
  // Testing React with all servers, but others UIs with only h3
  ["solid", "express"],
  ["solid", "hono"],
  ["solid", "fastify"],
  ["solid", "hattip"],
  ["vue", "express"],
  ["vue", "hono"],
  ["vue", "fastify"],
  ["vue", "hattip"],
  // Testing Cloudflare with Hattip and React only
  ["cloudflare", "express"],
  ["cloudflare", "h3"],
  ["cloudflare", "fastify"],
  ["cloudflare", "hono"],
  ["cloudflare", "solid"],
  ["cloudflare", "vue"],
];

// How to configure your environment for testing github oauth?
// First, create a .env.test file at the root of bati workspace
// Then, you must put your client ID and client SECRET in a .env.test like so
// TEST_GITHUB_CLIENT_ID=...
// TEST_GITHUB_CLIENT_SECRET=...

await describeBati(({ test, expect, fetch, context, beforeAll, testMatch }) => {
  beforeAll(
    async () => {
      if (context.flags.includes("drizzle")) {
        await exec(npmCli, ["run", "drizzle:generate"]);
        await exec(npmCli, ["run", "drizzle:migrate"]);
      } else if (context.flags.includes("sqlite")) {
        if (context.flags.includes("cloudflare")) {
          await exec(npmCli, ["run", "d1:migrate"]);
        } else {
          await exec(npmCli, ["run", "sqlite:migrate"]);
        }
      }
    },
    2 * 60 * 1000,
  );

  testMatch("include-if-imported", {
    drizzle: () => {
      expect(existsSync(path.join(process.cwd(), "database", "drizzle", "schema", "lucia-auth.ts"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "database", "drizzle", "queries", "lucia-auth.ts"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "database", "d1", "queries"))).toBe(false);
      expect(existsSync(path.join(process.cwd(), "database", "sqlite"))).toBe(false);
    },
    sqlite: {
      cloudflare: () => {
        expect(existsSync(path.join(process.cwd(), "database", "migrations", "lucia-auth.sql"))).toBe(true);
        expect(existsSync(path.join(process.cwd(), "database", "d1", "queries", "lucia-auth.ts"))).toBe(true);
        expect(existsSync(path.join(process.cwd(), "database", "drizzle"))).toBe(false);
        expect(existsSync(path.join(process.cwd(), "database", "sqlite"))).toBe(false);
      },
      _: () => {
        expect(existsSync(path.join(process.cwd(), "database", "sqlite", "schema", "lucia-auth.ts"))).toBe(true);
        expect(existsSync(path.join(process.cwd(), "database", "sqlite", "queries", "lucia-auth.ts"))).toBe(true);
        expect(existsSync(path.join(process.cwd(), "database", "drizzle"))).toBe(false);
        expect(existsSync(path.join(process.cwd(), "database", "d1"))).toBe(false);
      },
    },
  });

  test("login page", async () => {
    const res = await fetch("/login");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("signup & login", async () => {
    const signupRes = await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "usertest", password: "password" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(await signupRes.text()).toContain('{"status":"success"}');
    expect(signupRes.status).toBe(200);

    const loginRes = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "usertest", password: "password" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(await loginRes.text()).toContain('{"status":"success"}');
    expect(loginRes.status).toBe(200);
  });

  test("/api/login/github", async () => {
    if (!process.env.TEST_GITHUB_CLIENT_ID) {
      return;
    }
    const res = await fetch("/api/login/github", {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")?.includes(process.env.TEST_GITHUB_CLIENT_ID));
  });
});
