import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  "lucia-auth",
  ["drizzle", undefined],
  "eslint",
] as const;

export const exclude = [
  // Testing drizzle with React only is enough
  ["solid", "drizzle"],
  ["vue", "drizzle"],
  // Testing React with all servers, but others UIs with only h3
  ["solid", "express"],
  ["solid", "hono"],
  ["solid", "fastify"],
  ["solid", "hattip"],
  ["vue", "express"],
  ["vue", "hono"],
  ["vue", "fastify"],
  ["vue", "hattip"],
];

// How to configure your environment for testing github oauth?
// First, create a .env.test file at the root of bati workspace
// Then, you must put your client ID and client SECRET in a .env.test like so
// TEST_GITHUB_CLIENT_ID=...
// TEST_GITHUB_CLIENT_SECRET=...

await describeBati(({ test, expect, fetch, context, beforeAll }) => {
  beforeAll(
    async () => {
      if (context.flags.includes("drizzle")) {
        await exec(npmCli, ["run", "drizzle:generate"]);
        await exec(npmCli, ["run", "drizzle:migrate"]);
      }
    },
    2 * 60 * 1000,
  );

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
